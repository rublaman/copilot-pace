import { normalizeQuota, systemClock, type Clock, type Snapshot } from './domain';
import { responseError, SafeError, type HttpTransport, type SessionProvider } from './transport';

export interface ServiceState {
  phase: 'loading' | 'ready' | 'disconnected' | 'error';
  snapshot?: Snapshot;
  updatedAt?: number;
  failure?: SafeError;
}
export interface ServiceDependencies { sessions: SessionProvider; transport: HttpTransport; dataClock: Clock; wallClock?: Clock }

export class QuotaService {
  private state: ServiceState = { phase: 'loading' };
  private inFlight?: Promise<void>;
  private inFlightInteractive = false;
  private pendingConnect?: Promise<void>;
  private abort?: AbortController;
  private generation = 0;
  private disposed = false;
  private failures = 0;
  private sessionId?: string;
  private retryAt = 0;
  private reauthenticate = false;
  private readonly wallClock: Clock;
  constructor(private readonly deps: ServiceDependencies, private readonly onChange: (state: ServiceState) => void) {
    this.wallClock = deps.wallClock ?? systemClock;
  }
  get current(): ServiceState { return this.state; }
  get nextAllowedAt(): number { return this.retryAt; }
  private publish(state: ServiceState) { this.state = state; this.onChange(state); }
  reset() {
    this.generation++;
    this.abort?.abort();
    this.inFlight = undefined;
    this.inFlightInteractive = false;
    this.pendingConnect = undefined;
    this.sessionId = undefined;
    this.retryAt = 0;
    this.failures = 0;
    this.reauthenticate = false;
    if (!this.disposed) this.publish({ phase: 'loading' });
  }
  refresh(interactive = false): Promise<void> {
    if (this.disposed) return Promise.resolve();
    if (this.inFlight) {
      if (!interactive || this.inFlightInteractive) return this.inFlight;
      // A background read must not consume an explicit request to connect.
      if (!this.pendingConnect) {
        const generation = this.generation;
        const pending = this.inFlight.then(() => {
          if (this.pendingConnect === pending) this.pendingConnect = undefined;
          if (!this.disposed && generation === this.generation) return this.refresh(true);
        }).finally(() => { if (this.pendingConnect === pending) this.pendingConnect = undefined; });
        this.pendingConnect = pending;
      }
      return this.pendingConnect;
    }
    if (this.wallClock.now().getTime() < this.retryAt) return Promise.resolve();
    const generation = this.generation;
    const abort = new AbortController();
    this.abort = abort;
    this.publish({ ...this.state, phase: 'loading', failure: undefined });
    this.inFlightInteractive = interactive;
    const operation = this.read(interactive, generation, abort.signal).finally(() => {
      if (this.inFlight === operation) { this.inFlight = undefined; this.inFlightInteractive = false; }
    });
    this.inFlight = operation;
    return operation;
  }
  private async read(interactive: boolean, generation: number, signal: AbortSignal) {
    const active = () => !this.disposed && generation === this.generation && !signal.aborted;
    try {
      let session;
      try { session = await this.deps.sessions.get(interactive, interactive && this.reauthenticate); }
      catch { throw new SafeError('auth', 'GitHub authorization failed. Try connecting again.'); }
      if (!active()) return;
      if (!session) { this.sessionId = undefined; this.publish({ phase: 'disconnected' }); return; }
      if (session.id !== this.sessionId) { this.sessionId = session.id; this.reauthenticate = false; this.publish({ phase: 'loading' }); }
      const response = await this.deps.transport.request(session.accessToken, signal);
      if (!active()) return;
      const failure = responseError(response, this.wallClock.now().getTime());
      if (failure) throw failure;
      const snapshot = normalizeQuota(response.body, this.deps.dataClock.now());
      this.failures = 0;
      this.retryAt = 0;
      this.reauthenticate = false;
      this.publish({ phase: 'ready', snapshot, updatedAt: this.wallClock.now().getTime() });
    } catch (error) {
      if (!active()) return;
      const failure = error instanceof SafeError ? error : new SafeError('network', 'Could not refresh your usage.');
      if (failure.code === 'unauthorized') this.reauthenticate = true;
      this.failures++;
      if (failure.retryAt) this.retryAt = failure.retryAt;
      else if (['server', 'network', 'timeout', 'invalidResponse'].includes(failure.code)) {
        this.retryAt = this.wallClock.now().getTime() + Math.min(15 * 60_000, 30_000 * 2 ** Math.min(5, this.failures - 1));
      }
      const discard = ['unauthorized', 'forbidden', 'auth'].includes(failure.code);
      this.publish({ phase: 'error', failure, snapshot: discard ? undefined : this.state.snapshot, updatedAt: discard ? undefined : this.state.updatedAt });
    }
  }
  dispose() { this.disposed = true; this.reset(); }
}

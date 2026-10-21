import * as assert from 'node:assert/strict';
import { resolveStatusStyle, statusText } from '../../src/status';

describe('Status bar styles', () => {
  it('keeps the existing appearance as default and validates saved preferences', () => {
    assert.equal(resolveStatusStyle(undefined), 'text');
    assert.equal(resolveStatusStyle('invalid'), 'text');
    assert.equal(resolveStatusStyle('__proto__'), 'text');
    assert.equal(statusText('text', '40%', 40, 'Comfortable', false, false), '40% · Comfortable');
  });
  it('shows compact, segmented and dot indicators with the same percentage', () => {
    assert.equal(statusText('compact', '40%', 40, 'Comfortable', false, false), '$(github-copilot) 40%');
    assert.equal(statusText('bar', '40%', 40, 'Comfortable', false, false), '▰▰▰▱▱▱▱▱ 40%');
    assert.equal(statusText('dots', '40%', 40, 'Comfortable', false, false), '●●○○○ 40%');
  });
  it('keeps failures visible and does not fabricate a bar for unknown usage', () => {
    for (const style of ['text', 'compact', 'bar', 'dots'] as const) {
      assert.ok(statusText(style, '40%', 40, 'Out of date', true, false).includes('Out of date'));
      assert.equal(statusText(style, '—', null, 'Connect GitHub', true, false), 'Connect GitHub');
    }
  });
  it('distinguishes tiny positive usage, zero and an exhausted budget', () => {
    assert.equal(statusText('bar', '<0.1%', 0.01, 'Comfortable', false, true), '▰▱▱▱▱▱▱▱ <0.1% · Demo');
    assert.equal(statusText('dots', '0%', 0, 'Comfortable', false, false), '○○○○○ 0%');
    assert.equal(statusText('bar', '120%', 120, 'Over pace', false, false), '▰▰▰▰▰▰▰▰ 120%');
  });
});

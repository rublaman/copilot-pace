## Change

Describe the problem and the resulting behavior. Explain any user-visible changes.

## Validation

List the commands run, their results, and any checks still pending. For documentation changes, confirm that links and content are consistent.

## Applicable checks

- [ ] Correct base branch: `develop` for regular changes; `main` for release promotion or hotfixes.
- [ ] Behavior and security boundaries preserved, with regression coverage where needed.
- [ ] Documentation updated for changes to development, packaging, or publishing.

For a release, also complete the steps in `docs/RELEASING.md`: version and lockfile, changelog/license/README, CI for the final commit SHA, VSIX tests, release channel, planned tag, and manual validation evidence. Create the tag after merging. Remove this paragraph if it does not apply.

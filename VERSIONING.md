# Versioning Policy

This repo uses scale-based semantic versioning.

- `patch`: bug fixes, copy changes, auth hardening, UI clarity improvements, and non-breaking corrections to existing flows
- `minor`: a meaningful new capability such as a new endpoint, workflow, screen, integration action, or staff operation that is backward compatible
- `major`: a breaking change that requires clients, integrations, or operators to adapt

Release batching rules:

- Prefer one version bump per delivery batch, not per micro-fix.
- If a new feature lands and follow-up corrections land immediately after, release the feature as `x.Y.0` and the fixes as `x.Y.1`.
- Keep repo versions independent, but document cross-repo capabilities in changelogs when one feature spans CRM and LMS.

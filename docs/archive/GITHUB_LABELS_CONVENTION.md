# GitHub Labels Convention

This document defines the minimum label taxonomy used by Floit to generate consistent automatic release notes.

Release notes categories are configured in `.github/release.yml`.

## Core Labels (Minimum Required)

Apply at least one of these labels to every PR:

- `feature`: new capability for users or operators.
- `bug`: bug fix or regression correction.
- `ui`: user interface or design-system change.
- `backend`: service, API, or server-side behavior change.
- `ci`: CI/CD pipelines, automation, infrastructure, or deployment changes.
- `docs`: documentation-only changes.

## Extended Labels (Optional)

Use as secondary labels for more precision:

- Product/design: `ux`, `design`, `enhancement`, `feat`, `fix`, `bugfix`
- Platform/data: `api`, `database`, `devops`, `infra`
- Risk/scope: `breaking-change`, `breaking`, `skip-release-notes`

## Special Label Rules

- `breaking-change` / `breaking`
  - Use when there is an incompatible API/contract/behavior change.
  - Include migration notes in PR description.
- `skip-release-notes`
  - Use only for non-user-facing and low-value changes (e.g., typo-only internal updates).
  - Avoid overuse.

## Practical Examples

- New mobile filters on `/buscar`:
  - `feature`, `ui`, `ux`
- Fix map marker popup behavior:
  - `bug`, `ui`
- Add endpoint in analytics service:
  - `feature`, `backend`, `api`
- Update pipeline cache in CI:
  - `ci`, `devops`
- Changelog formatting update:
  - `docs`

## Suggested Repository Label Set

Create or keep these labels in GitHub:

- `breaking-change`
- `breaking`
- `feature`
- `enhancement`
- `feat`
- `bug`
- `bugfix`
- `fix`
- `ui`
- `ux`
- `design`
- `backend`
- `api`
- `database`
- `ci`
- `devops`
- `infra`
- `docs`
- `documentation`
- `skip-release-notes`

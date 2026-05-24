# Contributing to Floit

This repository uses pull requests, labels, and semantic versions to keep changelog and GitHub release notes consistent.

## Branch and Commit Guidelines

- Create feature branches from `main` using descriptive names:
  - `feat/search-mobile-filters`
  - `fix/leaflet-marker-popup`
  - `docs/changelog-semver`
- Prefer small PRs with a single purpose.
- Use clear commit messages in imperative form.

## Pull Request Checklist

Before requesting review:

- Ensure CI passes.
- Update docs if behavior, flows, or contracts changed.
- Add or update tests when applicable.
- Assign at least one release-note label from the convention in `docs/archive/GITHUB_LABELS_CONVENTION.md`.

## Labeling Rules (Release Notes)

GitHub automatic release notes are configured in `.github/release.yml`.
To ensure proper categorization, each PR should include:

1. Exactly one primary product label:
   - `feature`, `bug`, `ui`, `backend`, `ci`, or `docs`
2. Optional extra context labels:
   - `ux`, `design`, `api`, `database`, `devops`, `infra`, etc.
3. Add `breaking-change` (or `breaking`) when the PR introduces incompatible changes.
4. Add `skip-release-notes` only for internal/noise changes.

## Versioning and Changelog

- Versioning follows SemVer: `MAJOR.MINOR.PATCH`.
- Keep pending changes under `## [Unreleased]` in `docs/operations/CHANGELOG.md`.
- On release day:
  1. Move relevant entries from `[Unreleased]` to a new section: `## [x.y.z] - YYYY-MM-DD`.
  2. Create tag `vx.y.z`.
  3. Create GitHub Release and enable **Generate release notes**.

## Definition of Done for Release-Friendly PRs

- Scope is clear and tested.
- PR has release labels.
- `docs/operations/CHANGELOG.md` is updated when needed.
- No unresolved TODOs for critical behavior.

# Developer Docs

This folder contains engineering-facing documentation for Carousel.

## Start Here

- [Debug Playbook](./DEBUG_PLAYBOOK.md) — fastest scripts and flows for common debugging scenarios
- [Docker Study Guide](../reference/DOCKER_STUDY_GUIDE.md) — Docker/Compose quick reference with command parameters
- [Development Guide](./DEVELOPMENT.md) — local setup, structure, coding patterns
- [API Reference](./API.md) — backend endpoint and payload references
- [Contributing](./CONTRIBUTING.md) — coding and contribution standards
- [Project Summary](./PROJECT_SUMMARY.md) — system overview and implementation notes

## Debug-First Commands

From repository root:

- NPM facade (recommended):
  - `npm start backend`
  - `npm build`
  - `npm build roles`
  - `npm setup dev`
  - `npm stop backend`
  - `npm restart auth`
  - `npm run restart:auth`
  - `npm run restart:backend`
  - `npm run restart:frontend`
  - `npm run restart -- roles`
  - `npm run setup:dev`

- Restart one backend service quickly:
  - `./restart.ps1 -Target service -Service auth -Fast -NoBrowser`
- Restart all backend services quickly:
  - `./restart.ps1 -Target backend -Fast -NoBrowser`
- Restart frontend only (skip backend checks):
  - `./restart.ps1 -Target frontend -NoBrowser`

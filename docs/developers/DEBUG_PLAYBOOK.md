# Debug Playbook (Fast Inner Loop)

Use this guide to minimize restart time during debugging.

## Core Principle

Only restart what changed. Avoid full-stack restart unless validating end-to-end behavior.

## AI Change Verification Policy

For AI-driven code changes in this repository:

- Default verification must be automatic and lightweight: compile/build and/or unit tests.
- AI should not automatically start or stop services for validation.
- If integration testing or service lifecycle operations are needed, AI should report this in the summary and ask for explicit confirmation before running.

## New Prerequisite (Role Service)

`role-service` now persists roles/assignments in PostgreSQL.

- Required for any role/assignment API or Admin Roles UI validation.
- Local startup options:
	- Docker: `docker compose up -d postgres`
	- Local service: ensure PostgreSQL is running on `localhost:5432` with database `carousel_roles`.

If PostgreSQL is not available, `role-service` will fail during startup with a Hibernate dialect/JDBC metadata error.

## Script Capabilities Added for Fast Debugging

### `launch-backend.ps1`

- `-Service <shortcut>`: restart one service only
- `-Fast`: start from built JAR for faster startup
- `-SkipGlobalHealth`: skip full backend post-start validation
- `-NoBrowser`: do not open Swagger browser tab

### `launch-frontend.ps1`

- `-SkipBackendValidation`: launch frontend without requiring all backend services up
- `-NoBrowser`: do not open browser

### `restart.ps1`

- `-Target service -Service <shortcut>`: restart one backend service
- `-Target backend`: restart backend only
- `-Target frontend`: restart frontend only
- `-Fast`: use fast backend startup path
- `-NoBuild`: skip build step
- `-NoBrowser`: suppress browser launch

## Common Debug Scenarios

## Quickest Path: `debug.ps1` aliases

Use these shortcuts from repository root:

```powershell
./debug.ps1 auth
./debug.ps1 backend
./debug.ps1 ui
./debug.ps1 service user
```

Alias behavior:

- `auth` -> `./restart.ps1 -Target service -Service auth -Fast -NoBrowser`
- `backend` -> `./restart.ps1 -Target backend -Fast -NoBrowser`
- `ui` -> `./restart.ps1 -Target frontend -NoBrowser`
- `service <name>` -> `./restart.ps1 -Target service -Service <name> -Fast -NoBrowser`

## 1) Auth service change

When changing only auth-service backend code:

```powershell
# Fastest restart of only auth service
./restart.ps1 -Target service -Service auth -Fast -NoBrowser
```

If you need to ensure latest compiled classes before restart:

```powershell
./restart.ps1 -Target service -Service auth -NoBrowser
```

## 2) Core backend code change (multiple services impacted)

When shared logic/config affects more than one service:

```powershell
# Restart backend only, keep frontend running
./restart.ps1 -Target backend -Fast -NoBrowser
```

For clean rebuild before backend restart:

```powershell
./restart.ps1 -Target backend -NoBrowser
```

## 3) Frontend change requiring restart

Use this when changes affect startup config, environment wiring, or dev server state:

```powershell
./restart.ps1 -Target frontend -NoBrowser
```

This skips backend validation to avoid waiting for all services.

## 4) Frontend change that should be visible immediately

Most React/Vite code edits should hot-reload automatically with no script needed:

- JSX/TSX component changes
- CSS styling changes
- Most Redux/UI logic changes

Action: save files and refresh browser only if HMR did not update.

## Optional Direct Launch Commands

Use these when you do not need the restart wrapper:

```powershell
# Single backend service debug launch
./launch-backend.ps1 -Service auth -Fast -SkipGlobalHealth -NoBrowser

# Frontend debug launch without backend gating
./launch-frontend.ps1 -SkipBackendValidation -NoBrowser
```

## Service Shortcuts

From `shortcuts.map`:

- `auth`
- `user`
- `approve`
- `roles`
- `inventory`
- `gateway`

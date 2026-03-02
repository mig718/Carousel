# Docker Study Guide (Carousel)

Quick-reference for Docker commands used by this repository, including what each command does and what its parameters mean.

## 1) Main Workflows in This Repo

- Full deployable stack: app services + frontend + PostgreSQL
- Debug data stack: PostgreSQL only (run backend/frontend locally)
- PostgreSQL-only control: start/stop/logs/status for `postgres` service

## 2) NPM Shortcuts (Recommended)

These are the fastest commands to remember in interviews for this project:

- `npm run compose:app:up`
- `npm run compose:app:down`
- `npm run compose:app:logs`
- `npm run compose:debug:up`
- `npm run compose:debug:down`
- `npm run compose:debug:logs`
- `npm run dev:up`
- `npm run dev:down`
- `npm run postgres:start`
- `npm run postgres:stop`
- `npm run postgres:logs`
- `npm run postgres:status`

All of these route through `tools/task-runner.js` and execute Docker commands shown below.

## 3) Under-the-Hood Docker Commands

### A) Full app profile

#### `docker compose -f docker-compose.app.yml up -d --build`

What it does:
- Loads services from `docker-compose.app.yml`
- Builds images (if needed)
- Starts containers in detached mode

Parameter breakdown:
- `compose`: Uses Docker Compose v2 subcommand
- `-f docker-compose.app.yml`: Selects compose file
- `up`: Creates/starts services
- `-d`: Detached/background mode
- `--build`: Force build before start

#### `docker compose -f docker-compose.app.yml down`

What it does:
- Stops and removes containers/networks created by this compose project

Parameter breakdown:
- `down`: Stop/remove compose resources for this project

#### `docker compose -f docker-compose.app.yml logs -f --tail 200`

What it does:
- Streams logs for all services in the app profile

Parameter breakdown:
- `logs`: Show logs
- `-f`: Follow/stream continuously
- `--tail 200`: Start from last 200 lines per service

### B) Debug (DB-only) profile

#### `docker compose -f docker-compose.debug.yml up -d --build`

What it does:
- Starts only the debug stack (currently PostgreSQL)

#### `docker compose -f docker-compose.debug.yml down`

What it does:
- Stops/removes debug stack resources

#### `docker compose -f docker-compose.debug.yml logs -f --tail 200`

What it does:
- Streams logs for debug stack services

### C) PostgreSQL service control (single service)

#### `docker compose up -d postgres`

What it does:
- Starts only the `postgres` service from default compose context

Parameter breakdown:
- `up`: Create/start service
- `-d`: Detached mode
- `postgres`: Service name target

#### `docker compose stop postgres`

What it does:
- Stops only the `postgres` service container

Parameter breakdown:
- `stop`: Gracefully stop running service container
- `postgres`: Service name target

#### `docker compose logs -f --tail 200 postgres`

What it does:
- Streams logs for PostgreSQL only

Parameter breakdown:
- Same as app logs, plus `postgres` as service filter

#### `docker compose ps postgres`

What it does:
- Shows current status of PostgreSQL service container

Parameter breakdown:
- `ps`: List containers for compose project
- `postgres`: Service filter

## 4) Additional Docker Commands Used by Project Scripts

### `docker --version`

Used by `tools/task-runner.js` to verify Docker is installed/available before running Docker operations.

### `docker ps --format "{{.Names}}"`

Used by `setup-dev.ps1` to detect if container `carousel-postgres` is running.

Parameter breakdown:
- `ps`: List running containers
- `--format "{{.Names}}"`: Output only container names

### `docker exec -i carousel-postgres psql -U postgres -d <database> -v ON_ERROR_STOP=1`

Used by `setup-dev.ps1` to execute SQL seed/setup scripts inside the running PostgreSQL container.

Parameter breakdown:
- `exec`: Run command in running container
- `-i`: Keep STDIN open (required for script piping)
- `carousel-postgres`: Target container
- `psql`: PostgreSQL CLI tool
- `-U postgres`: DB user
- `-d <database>`: Target database name
- `-v ON_ERROR_STOP=1`: Stop script on first SQL error

## 5) Compose Files in This Repo

- `docker-compose.app.yml`
  - Full deployable package:
    - `postgres`
    - `auth-service`
    - `user-service`
    - `approval-service`
    - `role-service`
    - `inventory-service`
    - `api-gateway`
    - `frontend`

- `docker-compose.debug.yml`
  - Minimal debug data stack:
    - `postgres`

## 6) Networking & Volumes (Interview Deep-Dive)

### Network model used here

The compose files define one user-defined bridge network:

- `carousel-network` (driver: `bridge`)

Why this matters:
- Containers on the same network can resolve each other by service name (e.g., `postgres`, `user-service`).
- Service-to-service URLs in this repo use those names (`jdbc:postgresql://postgres:5432/...`).
- The network isolates this stack from unrelated containers.

Interview-friendly explanation:
- “We use a dedicated bridge network so each microservice can call dependencies by service DNS name, not hardcoded host IPs.”

### Volume model used here

The compose files define one named volume:

- `postgres_data`

Mounted as:
- `postgres_data:/var/lib/postgresql/data`

Why this matters:
- PostgreSQL data persists across container restarts/recreates.
- `docker compose down` will not delete named volumes unless `-v` is used.

Interview-friendly explanation:
- “We persist database state with a named volume so app containers are ephemeral but data is durable during local/dev cycles.”

### Operational cautions

- Resetting data:
  - `docker compose down -v` removes containers **and** named volumes (destructive for local DB state).
- Port publishing:
  - `5432:5432`, `8000:8000`, `3000:3000` expose container ports to host for local access.
  - Inter-container traffic does **not** require host port publishing; network DNS is enough.

## 7) Interview Notes (How to Explain Quickly)

- “We use Docker Compose profiles to separate full app deployment from lightweight DB-only local debugging.”
- “Our command facade (`tools/task-runner.js`) normalizes Docker operations behind npm scripts.”
- “For logs, we standardize on `logs -f --tail 200` to reduce noise but keep recent context.”
- “For DB setup, we stream SQL via `docker exec -i ... psql` and fail fast with `ON_ERROR_STOP=1`.”
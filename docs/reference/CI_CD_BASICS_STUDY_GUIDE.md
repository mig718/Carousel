# CI/CD Basics Study Guide (Carousel)

Short, interview-ready map of what CI/CD tools are used here, common commands, and how they fit together.

## 1) Tooling Status in This Repo

### Implemented in repo (actively used)

- **Maven** (`mvn`) for backend build/test/package
- **Node/NPM** (`npm`) for frontend build/test + command facade
- **Docker + Docker Compose** for local deployment and packaging flows
- **PowerShell orchestration scripts** (`build.ps1`, `launch-*.ps1`, `restart.ps1`, `check-backend.ps1`)

### Mentioned for deployment pattern (not fully checked-in as pipeline code)

- **Kubernetes** (`kubectl`) examples in docs
- **Helm** mentioned as optional

### Not present as configured pipeline files

- No `.github/workflows/*`
- No Azure DevOps YAML pipeline files

## 2) Most Common Commands

## A) Build/Verify

- Backend compile/package:
  - `Set-Location backend; mvn clean -DskipTests compile`
  - `Set-Location backend; mvn clean package -DskipTests`
- Backend tests (by module):
  - `Set-Location backend/auth-service; mvn test`
  - repeat for other services
- Frontend build/test:
  - `Set-Location frontend; npm install --legacy-peer-deps`
  - `Set-Location frontend; npm run build`
  - `Set-Location frontend; npm test`

## B) Local deployment (Compose)

- Full app:
  - `npm run compose:app:up`
  - `npm run compose:app:down`
  - `npm run compose:app:logs`
- Debug DB-only:
  - `npm run dev:up`
  - `npm run dev:down`

## C) DB utility

- `npm run postgres:start`
- `npm run postgres:stop`
- `npm run postgres:logs`
- `npm run postgres:status`

## 3) How It Fits (CI vs CD)

### CI (Continuous Integration)

Primary goal: validate code quality on every change.

Typical CI sequence for this repo:
1. Checkout code
2. Backend compile (`mvn clean -DskipTests compile`)
3. Backend tests (`mvn test` per module or reactor)
4. Frontend install/build/test
5. Publish artifacts (JARs, frontend build output)

### CD (Continuous Delivery/Deployment)

Primary goal: package and deploy validated artifacts.

Typical CD sequence for this repo:
1. Build service artifacts (`mvn clean package -DskipTests`)
2. Build container images (`docker build -t ...`)
3. Tag and push images (`docker tag`, `docker push`)
4. Deploy to runtime target:
   - Compose (local/self-hosted style), or
   - Kubernetes (doc-guided approach)

## 4) Minimal Pipeline Blueprint (Platform-Agnostic)

## Stage 1: Validate

- Backend: compile + unit tests
- Frontend: build + unit tests
- Fail fast on first broken stage

## Stage 2: Package

- Build backend JARs
- Build frontend static bundle
- (Optional) publish build artifacts

## Stage 3: Containerize

- Build image per service
- Tag with version + commit SHA
- Push to container registry

## Stage 4: Deploy

- Non-prod environment first
- Smoke check health endpoints
- Promote to higher environment

## 5) Kubernetes Fit (Current State)

What exists:
- Kubernetes usage examples in deployment docs (`kubectl apply`, `kubectl scale`).

What does not exist yet:
- No checked-in production-ready K8s manifests/Helm chart folder in repo.

Interview phrasing:
- “Current repository is Compose-first for local and demo deployment, with Kubernetes documented as a next deployment target.”

## 6) Common Interview Q&A (Quick)

### Q: Is this CI or CD ready?
- **A:** CI/CD foundations are present (build/test scripts, containerization, deployment docs), but hosted pipeline config files are not committed yet.

### Q: Which deployment tool is primary today?
- **A:** Docker Compose is the operational default in this repo.

### Q: Where does Kubernetes fit?
- **A:** Documented target path; useful for scale/prod orchestration once manifests/charts are formalized.

## 7) One-Line Summary

- “This project currently runs a script-and-compose driven CI/CD workflow: compile/test/package with Maven+NPM, containerize with Docker, deploy via Compose now, with Kubernetes as a documented next-step target.”

## 8) Appendix: GitHub Actions Starter YAML (Reference-Only)

These are starter examples for study/interview prep. They are **not** active until committed under `.github/workflows/`.

### A) CI Validate-Only Workflow

```yaml
name: ci-validate

on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Backend compile
        working-directory: backend
        run: mvn clean -DskipTests compile

      - name: Backend tests
        working-directory: backend
        run: mvn test

      - name: Frontend install
        working-directory: frontend
        run: npm ci

      - name: Frontend build
        working-directory: frontend
        run: npm run build
```

### B) CD Container Build/Push Workflow

```yaml
name: cd-container-publish

on:
  workflow_dispatch:
  push:
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAMESPACE: your-org-or-user/carousel

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service:
          - auth-service
          - user-service
          - approval-service
          - role-service
          - inventory-service
          - api-gateway
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./backend/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAMESPACE }}/${{ matrix.service }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAMESPACE }}/${{ matrix.service }}:latest
```
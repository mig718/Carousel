# CI/CD Pipeline Templates (Starter)

Reference templates you can adapt for this repository.

## 1) CI Validate-Only (GitHub Actions)

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
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'

      - uses: actions/setup-node@v4
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

      - name: Frontend install/build
        working-directory: frontend
        run: |
          npm ci
          npm run build
```

## 2) CD Container Publish (GitHub Actions)

```yaml
name: cd-publish

on:
  workflow_dispatch:
  push:
    tags: [ 'v*' ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAMESPACE: your-org-or-user/carousel

jobs:
  publish-backend-images:
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
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: ./backend/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAMESPACE }}/${{ matrix.service }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAMESPACE }}/${{ matrix.service }}:latest
```

## 3) CI Validate-Only (Azure DevOps)

```yaml
trigger:
  branches:
    include:
      - main

pr:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self

  - task: JavaToolInstaller@0
    inputs:
      versionSpec: '21'
      jdkArchitectureOption: x64
      jdkSourceOption: PreInstalled

  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'

  - script: mvn clean -DskipTests compile
    displayName: Backend compile
    workingDirectory: backend

  - script: mvn test
    displayName: Backend tests
    workingDirectory: backend

  - script: |
      npm ci
      npm run build
    displayName: Frontend build
    workingDirectory: frontend
```

## 4) CD Publish (Azure DevOps)

```yaml
trigger: none

pool:
  vmImage: ubuntu-latest

variables:
  containerRegistryServiceConnection: 'YOUR_ACR_CONNECTION'
  repositoryPrefix: 'carousel'

steps:
  - checkout: self

  - task: Docker@2
    displayName: Build and push auth-service
    inputs:
      command: buildAndPush
      containerRegistry: $(containerRegistryServiceConnection)
      repository: $(repositoryPrefix)/auth-service
      Dockerfile: backend/auth-service/Dockerfile
      buildContext: backend/auth-service
      tags: |
        $(Build.SourceVersion)
        latest
```

## 5) How to Adapt Quickly

1. Replace registry/org values.
2. Add secrets/service connections.
3. Expand service matrix or duplicate Docker tasks per service.
4. Add deploy stage (Compose, Kubernetes, or platform-specific release).

## 6) Notes for This Repository

- Compose-first operational model is already documented.
- Kubernetes is documented as target deployment path.
- Hosted pipeline YAML is not currently checked in; these templates are starter references.
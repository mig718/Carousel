# Carousel

Carousel is a full-stack user enrollment and approval system with a React frontend and Java/Spring microservices backend.

## Quick Start (NPM Orchestrated)

From repository root:

```powershell
# Full local app (PowerShell-based launch)
npm run all
npm start

# Backend only / frontend only
npm run backend
npm run frontend
npm start backend

# Start local prerequisites only (Docker Engine + PostgreSQL)
npm run start:deps

# Check local prerequisites only (no auto-start)
npm run check:deps

# Seed development data
npm run setup:dev
npm setup dev

# Restart one service
npm run restart -- auth
npm restart auth
# or use aliases like:
npm run restart:auth
```

`npm start backend` now runs prerequisite startup automatically (Docker Engine + PostgreSQL) before launching backend services.

## Docker Deploy Profiles

```powershell
# Full deployable package (frontend + all backend services + PostgreSQL)
npm run compose:app:up

# Stop full package
npm run compose:app:down

# Debug data stack only (PostgreSQL)
npm run dev:up
npm run dev:down
```

Equivalent PowerShell direct commands remain available (`launch.ps1`, `restart.ps1`, `setup-dev.ps1`).

## Documentation Map

- Developer docs: [docs/developers/README.md](docs/developers/README.md)
- Reference docs: [docs/reference/README.md](docs/reference/README.md)
- Debug playbook: [docs/developers/DEBUG_PLAYBOOK.md](docs/developers/DEBUG_PLAYBOOK.md)
- User/ops docs: [docs/users/README.md](docs/users/README.md)

## Key Endpoints

- Frontend: http://localhost:3000
- API Gateway / Swagger: http://localhost:8000/swagger-ui.html

Frontend will be available at: http://localhost:3000

### PostgreSQL Setup

PostgreSQL must be running on `localhost:5432`:

```bash
# Using project helper scripts
npm run postgres:start
```

The services use PostgreSQL for persistence.

## API Documentation

OpenAPI specifications are auto-generated and available at each service's Swagger UI:

- **Auth Service**: http://localhost:8001/api/auth/swagger-ui.html
- **User Service**: http://localhost:8002/api/users/swagger-ui.html
- **Approval Service**: http://localhost:8003/api/approvals/swagger-ui.html
- **Role Service**: http://localhost:8004/api/roles/swagger-ui.html
- **Inventory Service**: http://localhost:8005/api/inventory/swagger-ui.html
- **Styles Service**: http://localhost:8007/api/inventory/swagger-ui.html

## API Endpoints

### Authentication (Port 8001)

```
POST /api/auth/login
  - Request: { email, password }
  - Response: { token, userId, email }

POST /api/auth/validate
  - Request: { token, email }
  - Response: boolean
```

### User Management (Port 8002)

```
POST /api/users/register
  - Request: { firstName, lastName, email, password, accessLevel }
  - Response: { userId, email, message, requiresApproval }

GET /api/users/verify?token={token}
  - Verifies email address

GET /api/users/{userId}
  - Retrieves user by ID

GET /api/users/email/{email}
  - Retrieves user by email

GET /api/users/access-level/{accessLevel}
  - Gets users with equal or higher access level

GET /api/users/pending/verified
  - Gets verified pending users awaiting approval

POST /api/users/approve/{pendingUserId}
  - Approves a pending user
```

### Approvals (Port 8003)

```
POST /api/approvals/request
  - Request: { pendingUserId, email, firstName, lastName, requestedAccessLevel }
  - Creates approval request

GET /api/approvals/pending
  - Gets all pending approvals

POST /api/approvals/{approvalId}/approve
  - Query: approverEmail
  - Approves a user request
```

## Frontend Routes

- `/login` - Login page
- `/register` - User registration
- `/verify` - Email verification
- `/pending-approval` - Pending approval status
- `/dashboard` - Main dashboard (protected)
- `/approvals` - Pending approvals list (protected)

## Testing

### Backend Tests

Run tests for each service:

```bash
cd backend/auth-service
mvn test

cd backend/user-service
mvn test

cd backend/approval-service
mvn test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## Technology Stack

### Backend
- **Spring Boot** 3.2.0
- **Spring Cloud** 2023.0.0
- **PostgreSQL**
- **JWT** (jjwt)
- **Lombok**
- **SpringDoc OpenAPI** 2.0.4

### Frontend
- **React** 18.2.0
- **TypeScript** 5.3.0
- **Redux & Redux Toolkit** 1.9.0
- **Axios** 1.6.0
- **React Router** 6.20.0

## Project Structure

```
Carousel/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ auth-service/
â”‚   â”œâ”€â”€ user-service/
â”‚   â”œâ”€â”€ approval-service/
â”‚   â”œâ”€â”€ role-service/
â”‚   â”œâ”€â”€ inventory-service/
â”‚   â”œâ”€â”€ styles-service/
â”‚   â”œâ”€â”€ api-gateway/
â”‚   â””â”€â”€ pom.xml (parent)
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ redux/
â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ types/
â”‚   â”‚   â””â”€â”€ __tests__/
â”‚   â”œâ”€â”€ public/
â”‚   â”œâ”€â”€ package.json
â”‚   â””â”€â”€ tsconfig.json
â””â”€â”€ README.md
```

## Access Levels

1. **ReadOnly**: No approval required, automatic access after email verification
2. **ReadWrite**: Requires approval from Admin or ReadWrite users
3. **Admin**: Requires approval from existing Admin users

## Future Enhancements

- OAuth2/OIDC integration
- Multi-factor authentication (MFA)
- Audit logging
- User role management
- Advanced approval workflows
- Real-time notifications
- Mobile application
- Microservice discovery (Eureka)
- API rate limiting
- CORS configuration refinement

## Contributing

Contributions are welcome! Please follow standard Git workflow:
1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact the development team.


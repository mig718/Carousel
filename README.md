# Carousel - User Enrollment & Approval System

A comprehensive full-stack application for user enrollment with access level management and approval workflows.

## Project Overview

Carousel is a microservices-based application that handles:

- **User Registration**: First-time user enrollment with email verification
- **Access Levels**: Three-tier access system (ReadOnly, ReadWrite, Admin)
- **Approval Workflow**: Non-ReadOnly users require approval from existing users
- **User Authentication**: JWT-based login system
- **API Documentation**: Auto-generated OpenAPI specifications

## Architecture

### Backend Microservices

- **Auth Service** (Port 8001): JWT token generation and validation
- **User Service** (Port 8002): User registration, verification, and management
- **Approval Service** (Port 8003): User approval workflow
- **API Gateway** (Port 8000): Routes requests to appropriate services
- **Health Service** (Port 8004): Lightweight aggregated health checks across all backend services

### Frontend

- **React & TypeScript**: Modern UI framework
- **Redux & Redux Toolkit**: State management
- **Axios**: HTTP client for API communication
- **React Router**: Client-side routing

## User Flows

### Registration Flow

1. User provides: First name, Last name, Email, Password, Access Level
2. Email verification token is sent
3. For ReadOnly access: Account created immediately after email verification
4. For ReadWrite/Admin: Approval request created for existing admins

### Email Verification

1. Verification email sent with unique token
2. User clicks link to verify email
3. System marks email as verified
4. For non-ReadOnly users, approval process begins

### Approval Workflow

1. Pending users with verified emails are sent for approval
2. Users with equal or higher access level receive approval notifications
3. Any approver can approve the pending user
4. Once approved, user account is created
5. User can login with their credentials

## Getting Started

### Prerequisites

- Java 17+
- Maven
- Node.js 16+
- MongoDB
- Docker (optional for containerization)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Build all services:
```bash
mvn clean install
```

3. Run each service:

```bash
# Auth Service
cd auth-service && mvn spring-boot:run

# User Service (in new terminal)
cd user-service && mvn spring-boot:run

# Approval Service (in new terminal)
cd approval-service && mvn spring-boot:run

# API Gateway (in new terminal)
cd api-gateway && mvn spring-boot:run
```

Services will be available at:
- API Gateway: http://localhost:8000
- Auth Service: http://localhost:8001
- User Service: http://localhost:8002
- Approval Service: http://localhost:8003
- Health Service: http://localhost:8004

### Backend-only Quick Launch (Windows)

To launch only backend services (no frontend), validate startup, and open a single consolidated Swagger UI tab:

```powershell
# Standard mode (uses mvn spring-boot:run, ~130s)
.\launch-backend.ps1

# Fast startup mode (uses prebuilt JARs, ~100s)
.\launch-backend.ps1 --fast
```

This opens:
- Swagger UI (all APIs): http://localhost:8000/swagger-ui.html

Launch behavior:
- Existing backend instances on ports `8000-8004` are restarted to ensure latest code is always running
- Startup succeeds only when health aggregation reports overall `UP` via `http://localhost:8004/health`
- If any service fails to become healthy, startup terminates and all newly started backend processes are stopped
- Per-service and total startup times are displayed in the final summary

**For fast startup:** First build once with `cd backend && mvn clean install && cd ..`, then use `--fast` flag for rapid iterations (~25% faster than standard mode)

To stop only backend services:

```powershell
.\stop-backend.ps1
```

### Development & Testing

#### Setup Development Database

Pre-populate MongoDB with realistic test data for manual testing:

```powershell
.\setup-dev.ps1
```

This creates:
- **3 verified & approved users** at different access levels
- **2 pending users** awaiting approval
- Realistic names and email addresses (no "test@test.com" data)

#### Test Login Credentials

After running `setup-dev.ps1`, use these credentials to manually test the application:

**Admin Access:**
- Email: `alice.johnson@acmecorp.com`
- Password: `SecureTest@2024`
- Access Level: Admin
- Status: Verified & Approved

**ReadWrite Access:**
- Email: `bob.smith@acmecorp.com`
- Password: `SecureTest@2024`
- Access Level: ReadWrite
- Status: Verified & Approved

**ReadOnly Access:**
- Email: `carol.williams@acmecorp.com`
- Password: `SecureTest@2024`
- Access Level: ReadOnly
- Status: Verified & Approved

**Pending Approval (ReadWrite):**
- Email: `david.brown@techstartup.io`
- Password: `TestPass@789`
- Status: Awaiting approval from Admin

**Pending Approval (Admin):**
- Email: `emma.davis@innovate.co`
- Password: `DevTest@456`
- Status: Awaiting approval from existing Admin

#### Sanity Test Script

Run comprehensive API tests via curl to validate backend functionality:

```powershell
.\sanity-test.ps1
```

Tests include:
- User registration and duplicate detection
- Login success/failure scenarios
- User lookups by email and access level
- Unauthorized access rejection
- Pending approval workflow
- Aggregated health checks
- Per-service health validation

Output format:
- âœ“ (green checkmark) = test passed
- âœ— (red cross) = test failed
- âŠ˜ (yellow copy sign) = warning/duplicate detected

Run with verbose output:

```powershell
.\sanity-test.ps1 -Verbose $true
```

#### Integration Tests

Comprehensive Spring Boot integration tests validate microservice functionality:

```bash
# Run all backend integration tests
cd backend
mvn test

# Run tests for specific service
cd auth-service
mvn test

cd ../user-service
mvn test

cd ../approval-service
mvn test
```

Integration tests include:
- **Auth Service**: Login success/failure, token validation, wrong password handling
- **User Service**: Registration, duplicate detection, user lookups, access level filtering
- **Approval Service**: Approval request creation and retrieval

### Health Endpoints

- Aggregated overall health: `GET http://localhost:8004/health`
- Per-service health through health-service:
  - `GET http://localhost:8004/health/auth-service`
  - `GET http://localhost:8004/health/user-service`
  - `GET http://localhost:8004/health/approval-service`
  - `GET http://localhost:8004/health/api-gateway`
- Dedicated health endpoint in each service:
  - Auth: `GET http://localhost:8001/api/auth/health`
  - User: `GET http://localhost:8002/api/users/health`
  - Approval: `GET http://localhost:8003/api/approvals/health`
  - API Gateway: `GET http://localhost:8000/health`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

Frontend will be available at: http://localhost:3000

### MongoDB Setup

MongoDB must be running on `localhost:27017`:

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Each service uses its own database:
- carousel_auth
- carousel_user
- carousel_approval

## API Documentation

OpenAPI specifications are auto-generated and available at each service's Swagger UI:

- **Auth Service**: http://localhost:8001/api/auth/swagger-ui.html
- **User Service**: http://localhost:8002/api/users/swagger-ui.html
- **Approval Service**: http://localhost:8003/api/approvals/swagger-ui.html

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
- **MongoDB**
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


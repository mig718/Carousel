# API Specification

This document describes the RESTful API endpoints for the Carousel system.

## Base URLs

- **Gateway (Production)**: http://localhost:8000
- **Auth Service (Dev)**: http://localhost:8001/api/auth
- **User Service (Dev)**: http://localhost:8002/api/users
- **Approval Service (Dev)**: http://localhost:8003/api/approvals

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication Service

#### POST /login
Authenticates user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid password"
}
```

#### POST /validate
Validates a JWT token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
true
```

---

### User Service

#### POST /register
Registers a new user.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "accessLevel": "ReadWrite"
}
```

**Response (200 OK):**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "message": "Registration successful. Please verify your email.",
  "requiresApproval": true
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Email already registered"
}
```

#### GET /verify?token={token}
Verifies user email address.

**Response (200 OK):**
```json
"Email verified successfully"
```

**Response (400 Bad Request):**
```json
{
  "message": "Invalid verification token"
}
```

#### GET /{userId}
Retrieves user by ID.

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "accessLevel": "ReadWrite"
}
```

#### GET /email/{email}
Retrieves user by email address.

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "accessLevel": "ReadWrite"
}
```

#### GET /access-level/{accessLevel}
Retrieves users with equal or higher access level.

**Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "accessLevel": "ReadWrite"
  }
]
```

#### GET /pending/verified
Retrieves verified pending users awaiting approval.

**Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "requestedAccessLevel": "Admin",
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00"
  }
]
```

#### POST /approve/{pendingUserId}
Approves a pending user and creates full user account.

**Response (200 OK):**
```json
"User approved successfully"
```

---

### Approval Service

#### POST /request
Creates an approval request for a pending user.

**Request:**
```json
{
  "pendingUserId": "507f1f77bcf86cd799439011",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "requestedAccessLevel": "ReadWrite"
}
```

**Response (200 OK):**
```json
"Approval request created and notifications sent"
```

#### GET /pending
Retrieves all pending approval requests.

**Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "pendingUserId": "507f1f77bcf86cd799439011",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "requestedAccessLevel": "ReadWrite",
    "approved": false
  }
]
```

#### POST /{approvalId}/approve
Approves a pending user request.

**Query Parameters:**
- `approverEmail` (required): Email of the approver

**Response (200 OK):**
```json
"User approved successfully"
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "message": "Token is invalid or expired"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "An unexpected error occurred"
}
```

## HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error


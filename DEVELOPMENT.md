# Development Guide

## Setting Up Development Environment

### Prerequisites

- JDK 17
- Maven 3.9+
- Node.js 16+
- MongoDB Community Edition
- Git
- VS Code or IntelliJ IDEA

### Backend Setup

1. Install dependencies:
```bash
cd backend
mvn clean install
```

2. Create MongoDB databases:
```bash
# Using MongoDB CLI or MongoDBCompass, create:
# - carousel_auth
# - carousel_user
# - carousel_approval
```

3. Run services in separate terminals:
```bash
# Terminal 1 - Auth Service
cd auth-service
mvn spring-boot:run

# Terminal 2 - User Service
cd user-service
mvn spring-boot:run

# Terminal 3 - Approval Service
cd approval-service
mvn spring-boot:run

# Terminal 4 - API Gateway
cd api-gateway
mvn spring-boot:run
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm start
```

## Project File Structure

### Backend Service Structure

Each microservice follows this structure:

```
service-name/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main/
â”‚   â”‚   â”œâ”€â”€ java/com/carousel/{service}/
â”‚   â”‚   â”‚   â”œâ”€â”€ controller/      # REST controllers
â”‚   â”‚   â”‚   â”œâ”€â”€ service/         # Business logic
â”‚   â”‚   â”‚   â”œâ”€â”€ repository/      # Data access
â”‚   â”‚   â”‚   â”œâ”€â”€ domain/          # Entity models
â”‚   â”‚   â”‚   â”œâ”€â”€ dto/             # Data transfer objects
â”‚   â”‚   â”‚   â””â”€â”€ {Service}Application.java
â”‚   â”‚   â””â”€â”€ resources/
â”‚   â”‚       â””â”€â”€ application.yml   # Service configuration
â”‚   â””â”€â”€ test/
â”‚       â”œâ”€â”€ java/                 # Unit tests
â”‚       â””â”€â”€ resources/            # Test configuration
â”œâ”€â”€ pom.xml
â””â”€â”€ Dockerfile
```

### Frontend Structure

```
frontend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ pages/                   # Page components
â”‚   â”œâ”€â”€ components/              # Reusable components
â”‚   â”œâ”€â”€ redux/                   # Redux slices and store
â”‚   â”œâ”€â”€ services/                # API service calls
â”‚   â”œâ”€â”€ types/                   # TypeScript interfaces
â”‚   â”œâ”€â”€ __tests__/               # Test files
â”‚   â”œâ”€â”€ App.tsx
â”‚   â”œâ”€â”€ index.tsx
â”‚   â””â”€â”€ App.css
â”œâ”€â”€ public/
â”‚   â””â”€â”€ index.html
â”œâ”€â”€ package.json
â””â”€â”€ tsconfig.json
```

## Common Development Tasks

### Adding a New Endpoint

1. Create DTO (Data Transfer Object):
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyRequestDto {
    private String field1;
}
```

2. Add repository method (if needed):
```java
public interface MyRepository extends MongoRepository<MyEntity, String> {
    Optional<MyEntity> findByField(String field);
}
```

3. Add service method:
```java
@Service
public class MyService {
    public MyResponseDto myMethod(MyRequestDto request) {
        // Implementation
    }
}
```

4. Add controller endpoint:
```java
@RestController
@RequestMapping("/my-endpoint")
public class MyController {
    @PostMapping
    public ResponseEntity<MyResponseDto> myEndpoint(@RequestBody MyRequestDto request) {
        return ResponseEntity.ok(service.myMethod(request));
    }
}
```

5. Add Swagger documentation:
```java
@Operation(summary = "Do something", description = "Description of what it does")
@PostMapping
public ResponseEntity<MyResponseDto> myEndpoint(@RequestBody MyRequestDto request) {
    // ...
}
```

### Adding a Redux Feature

1. Create slice:
```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const myAsyncThunk = createAsyncThunk('name/action', async (data) => {
  // async operation
});

const mySlice = createSlice({
  name: 'myFeature',
  initialState: { /* ... */ },
  reducers: {
    // synchronous actions
  },
  extraReducers: (builder) => {
    builder.addCase(myAsyncThunk.fulfilled, (state, action) => {
      // handle success
    });
  }
});

export default mySlice.reducer;
```

2. Add to store:
```typescript
import myReducer from './mySlice';

export const store = configureStore({
  reducer: {
    myFeature: myReducer,
    // ...
  }
});
```

3. Use in component:
```typescript
import { useDispatch, useSelector } from 'react-redux';

const MyComponent = () => {
  const dispatch = useDispatch();
  const { data } = useSelector(state => state.myFeature);
  
  return (
    // JSX
  );
};
```

### Writing Tests

#### Backend Test Example

```java
@SpringBootTest
public class MyServiceTest {
    @Autowired
    private MyService service;
    
    @Autowired
    private MyRepository repository;
    
    @BeforeEach
    public void setUp() {
        repository.deleteAll();
    }
    
    @Test
    public void testMyMethod() {
        // Arrange
        MyEntity entity = new MyEntity("test");
        repository.save(entity);
        
        // Act
        MyResponseDto result = service.getMethod(entity.getId());
        
        // Assert
        assertEquals("test", result.getValue());
    }
}
```

#### Frontend Test Example

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  test('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

## Debugging

### Backend Debugging

Using Remote Debug with IDE:
1. Add to JVM options in pom.xml
2. Set breakpoints in IDE
3. Run with: `mvn spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"`

### Frontend Debugging

1. Chrome DevTools: Open with F12
2. VS Code Debugger: Create .vscode/launch.json
3. React DevTools extension
4. Redux DevTools extension

## API Testing

### Using curl

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Register
curl -X POST http://localhost:8000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","password":"pass","accessLevel":"ReadOnly"}'
```

### Using Postman

1. Import API collection from API.md
2. Set environment variables for baseUrl
3. Use tests to validate responses

## Performance Tips

- Use Redux selectors to prevent unnecessary re-renders
- Implement pagination in list endpoints
- Use database indexes for frequently queried fields
- Cache API responses where appropriate
- Implement lazy loading for frontend

## Security Checklist

- [ ] Validate all user inputs
- [ ] Sanitize database queries
- [ ] Use HTTPS in production
- [ ] Store secrets in environment variables
- [ ] Implement rate limiting
- [ ] Use parameterized queries
- [ ] Expire sessions properly
- [ ] Log security events


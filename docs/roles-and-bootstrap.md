# User Roles & Bootstrap System

## User Roles

The system now supports comprehensive role-based access control with the following roles:

### Hierarchy & Capabilities

```
SUPER_ADMIN (Highest)
  ├─ System-wide access
  ├─ Manage all organizations
  ├─ Manage all schools
  └─ View all data

ORGANIZATION_ADMIN
  ├─ Manage organization
  ├─ Manage schools within organization
  ├─ Manage staff & admins
  └─ View organization data

COACHING_ADMIN
  ├─ Manage school
  ├─ Manage teachers & classes
  ├─ Manage students & parents
  └─ View school data

ADMIN
  ├─ General administrative functions
  ├─ Manage users
  └─ Limited data access

TEACHER (Mid-level)
  ├─ Manage classes
  ├─ Mark attendance
  ├─ Manage grades
  └─ Communicate with students/parents

STAFF (Mid-level)
  ├─ Support functions
  ├─ Manage facilities
  └─ Report generation

STUDENT (Low)
  ├─ View own grades
  ├─ View assignments
  ├─ Submit assignments
  └─ Communicate with teacher

PARENT (Low)
  ├─ View child's grades
  ├─ View attendance
  ├─ Communicate with teacher
  └─ View announcements
```

### Role Creation Policy

Who can create whom:

| Actor Role | Allowed Target Roles |
| --- | --- |
| `SUPER_ADMIN` | `ORGANIZATION_ADMIN`, `COACHING_ADMIN`, `ADMIN`, `TEACHER`, `STAFF`, `STUDENT`, `PARENT` |
| `ORGANIZATION_ADMIN` | `COACHING_ADMIN`, `ADMIN`, `TEACHER`, `STAFF`, `STUDENT`, `PARENT` |
| `COACHING_ADMIN` | `ADMIN`, `TEACHER`, `STAFF`, `STUDENT`, `PARENT` |
| `ADMIN` | `TEACHER`, `STAFF`, `STUDENT`, `PARENT` |
| Others | None |

### Tenancy Rules

- All non-`SUPER_ADMIN` users require `organizationId` and `schoolId`.
- `SUPER_ADMIN` can be global with no tenant fields.
- Admin APIs validate tenant scope on every write.

### Registration Policy

- `POST /api/auth/register` is admin-only.
- Role creation must pass `RoleCreationPolicy` checks.
- Student creation auto-creates a parent account and links it.

### Database Model

```typescript
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',           // Platform administrator
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN', // Organization/Company admin
  COACHING_ADMIN = 'COACHING_ADMIN',         // School administrator
  ADMIN = 'ADMIN',                       // General admin
  TEACHER = 'TEACHER',                   // Teacher/Educator
  STUDENT = 'STUDENT',                   // Student
  PARENT = 'PARENT',                     // Parent/Guardian
  STAFF = 'STAFF',                       // Support staff
}
```

### MongoDB Schema

```javascript
{
  "_id": "user-id",
  "email": "user@example.com",
  "password": "hashed-password",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "COACHING_ADMIN",  // One of the roles above
  "organizationId": "org-id",
  "schoolId": "school-id",
  "isActive": true,
  "emailVerified": false,
  "createdAt": "2026-02-08T10:00:00Z",
  "updatedAt": "2026-02-08T10:00:00Z"
}
```

Note: `SUPER_ADMIN` users may omit `organizationId` and `schoolId`.

### RBAC & Audit Logs

- Permissions live in `src/shared/infrastructure/rbac.ts`.
- Role policy lives in `src/shared/infrastructure/role-policy.ts`.
- Audit logs are written for user and admin resource creation.
- Audit schema: `src/shared/infrastructure/audit-log.ts`.

## Bootstrap System

### Overview

The bootstrap system provides a centralized dependency injection container for managing all application services. It ensures proper initialization of:

- Database connections
- Repositories
- Use cases
- External services
- Configuration

### Core Components

#### 1. Container
Singleton dependency injection container managing all services

```typescript
import { Container, ServiceKeys } from '@/shared/bootstrap';

// Register service
Container.register(ServiceKeys.MY_SERVICE, myService);

// Resolve service
const service = Container.resolve(ServiceKeys.MY_SERVICE);
```

#### 2. AppBootstrap
Initializes all application dependencies once

```typescript
import { AppBootstrap } from '@/shared/bootstrap';

// Initialize
await AppBootstrap.initialize();

// Check status
if (AppBootstrap.isBootstrapped()) {
  // Ready to use
}
```

#### 3. Initialization Hook
Safely initializes app and resolves services

```typescript
import { initializeAppAndGetService, ServiceKeys } from '@/shared/bootstrap/init';

// Get service with automatic initialization
const userRepo = await initializeAppAndGetService(
  ServiceKeys.USER_REPOSITORY
);
```

### Service Keys

All services are registered with predefined keys:

```typescript
import { ServiceKeys } from '@/shared/bootstrap';

// User Management Services
ServiceKeys.USER_REPOSITORY              // MongoUserRepository
ServiceKeys.CREATE_USER_USE_CASE         // CreateUserUseCase
ServiceKeys.GET_USER_BY_EMAIL_USE_CASE   // GetUserByEmailUseCase
ServiceKeys.VERIFY_USER_EMAIL_USE_CASE   // VerifyUserEmailUseCase

// Organization & School Services
ServiceKeys.ORGANIZATION_REPOSITORY      // MongoOrganizationRepository
ServiceKeys.SCHOOL_REPOSITORY            // MongoSchoolRepository
ServiceKeys.CREATE_ORGANIZATION_USE_CASE // CreateOrganizationUseCase
ServiceKeys.CREATE_SCHOOL_USE_CASE       // CreateSchoolUseCase

// Add more as you extend the system
```

### Usage in API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';

export async function GET(request: NextRequest) {
  try {
    // Get use case with automatic initialization
    const getUserUseCase = await initializeAppAndGetService(
      ServiceKeys.GET_USER_BY_EMAIL_USE_CASE
    );

    const result = await getUserUseCase.execute({
      email: request.nextUrl.searchParams.get('email')!,
    });

    if (result.getIsSuccess()) {
      return NextResponse.json(result.getValue());
    }

    return NextResponse.json(
      { error: result.getError() },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Usage in Server Components

```typescript
import { initializeAppAndGetService, ServiceKeys } from '@/shared/bootstrap/init';

export default async function UsersPage() {
  const userRepository = await initializeAppAndGetService(
    ServiceKeys.USER_REPOSITORY
  );

  const users = await userRepository.findAll();

  return (
    <div>
      <h1>Users ({users.length})</h1>
      {users.map(user => (
        <div key={user.getId()}>
          <strong>{user.getName().getFullName()}</strong>
          <p>{user.getEmail().getValue()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Adding New Services

#### Step 1: Create the Service

```typescript
// src/domains/my-domain/MyService.ts
export class MyService {
  async doSomething() {
    // Implementation
  }
}
```

#### Step 2: Add Service Key

```typescript
// src/shared/bootstrap/AppBootstrap.ts
export const ServiceKeys = {
  // ... existing keys
  MY_SERVICE: 'MY_SERVICE',
};
```

#### Step 3: Register in Bootstrap

```typescript
// src/shared/bootstrap/AppBootstrap.ts
private static registerServices(): void {
  const logger = getLogger();
  
  Container.registerSingleton(ServiceKeys.MY_SERVICE, () => {
    logger.debug('Creating MyService instance');
    return new MyService();
  });
}
```

#### Step 4: Use Your Service

```typescript
const myService = await initializeAppAndGetService(ServiceKeys.MY_SERVICE);
await myService.doSomething();
```

## Best Practices

### 1. Always Initialize Before Use

```typescript
// ❌ Unsafe - might fail
const repo = Container.resolve(ServiceKeys.USER_REPOSITORY);

// ✅ Safe - automatic initialization
const repo = await initializeAppAndGetService(ServiceKeys.USER_REPOSITORY);
```

### 2. Use Service Keys Over Strings

```typescript
// ❌ Avoid magic strings
Container.register('user_repository', repo);
const service = Container.resolve('user_repository');

// ✅ Use constants
Container.registerSingleton(ServiceKeys.USER_REPOSITORY, () => repo);
const service = Container.resolve(ServiceKeys.USER_REPOSITORY);
```

### 3. Register as Singletons

```typescript
// ❌ Creates new instance each time
Container.registerFactory(ServiceKeys.USER_REPOSITORY, () => new MongoUserRepository());

// ✅ Single instance, better performance
Container.registerSingleton(ServiceKeys.USER_REPOSITORY, () => new MongoUserRepository());
```

### 4. Handle Errors Gracefully

```typescript
try {
  const service = await initializeAppAndGetService(ServiceKeys.USER_REPOSITORY);
  // Use service
} catch (error) {
  logger.error('Failed to initialize service', error as Error);
  return NextResponse.json(
    { error: 'Service initialization failed' },
    { status: 503 }
  );
}
```

### 5. Log Service Creation

```typescript
Container.registerSingleton(ServiceKeys.USER_REPOSITORY, () => {
  logger.debug('Initializing MongoUserRepository');
  return new MongoUserRepository();
});
```

## Extending With New Domains

When adding a new domain (e.g., StudentManagement):

1. Create domain structure:
   ```
   src/domains/student-management/
   ├── domain/
   │   ├── entities/
   │   ├── value-objects/
   │   ├── repositories/
   │   └── domain-events/
   ├── application/
   │   ├── use-cases/
   │   ├── dtos/
   │   └── mappers/
   └── infrastructure/
       ├── persistence/
       └── external-services/
   ```

2. Add service keys:
   ```typescript
   export const ServiceKeys = {
     // ... existing
     STUDENT_REPOSITORY: 'STUDENT_REPOSITORY',
     CREATE_STUDENT_USE_CASE: 'CREATE_STUDENT_USE_CASE',
   };
   ```

3. Register in AppBootstrap:
   ```typescript
   private static registerRepositories(): void {
     // ... existing
     Container.registerSingleton(ServiceKeys.STUDENT_REPOSITORY, () => {
       return new MongoStudentRepository();
     });
   }

   private static registerUseCases(): void {
     // ... existing
     Container.registerSingleton(ServiceKeys.CREATE_STUDENT_USE_CASE, () => {
       const studentRepository = Container.resolve(ServiceKeys.STUDENT_REPOSITORY);
       return new CreateStudentUseCase(studentRepository);
     });
   }
   ```

4. Use in your code:
   ```typescript
   const useCase = await initializeAppAndGetService(
     ServiceKeys.CREATE_STUDENT_USE_CASE
   );
   ```

## Testing with Bootstrap

### Reset Between Tests

```typescript
import { AppBootstrap } from '@/shared/bootstrap';

describe('API Tests', () => {
  afterEach(() => {
    AppBootstrap.reset();
  });

  it('should test API', async () => {
    // App resets automatically after each test
  });
});
```

### Mock Services

```typescript
import { Container, ServiceKeys } from '@/shared/bootstrap';

describe('User API', () => {
  it('should use mock repository', () => {
    const mockRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    };

    Container.register(ServiceKeys.USER_REPOSITORY, mockRepository);
    
    // Test with mocked service
  });
});
```

---

For more details, see:
- [bootstrap.md](./bootstrap.md) - Complete bootstrap guide
- [architecture.md](./architecture.md) - DDD architecture
- [README.md](../README.md) - Quick start guide

# Application Bootstrap Guide

## Overview

The bootstrap system provides dependency injection and application initialization for the Coaching Management System. It uses a singleton Container pattern to manage all application services.

## Architecture

### Container

The `Container` class is a dependency injection container that manages all application dependencies.

```typescript
import { Container, getService, registerService } from '@/shared/bootstrap';

// Register a dependency
Container.register('myService', myServiceInstance);

// Register a singleton (lazy initialized, reused)
Container.registerSingleton('myService', () => myServiceFactory());

// Register a factory (new instance each time)
Container.registerFactory('myService', () => myServiceFactory());

// Resolve a dependency
const service = Container.resolve('myService');

// Or use the service locator
const service = getService('myService');
```

### Service Keys

All registered services use predefined keys for type safety:

```typescript
import { ServiceKeys } from '@/shared/bootstrap';

// Available keys:
ServiceKeys.USER_REPOSITORY            // MongoUserRepository
ServiceKeys.CREATE_USER_USE_CASE       // CreateUserUseCase
ServiceKeys.GET_USER_BY_EMAIL_USE_CASE // GetUserByEmailUseCase
ServiceKeys.VERIFY_USER_EMAIL_USE_CASE // VerifyUserEmailUseCase
ServiceKeys.ORGANIZATION_REPOSITORY    // MongoOrganizationRepository
ServiceKeys.SCHOOL_REPOSITORY          // MongoSchoolRepository
ServiceKeys.CREATE_ORGANIZATION_USE_CASE // CreateOrganizationUseCase
ServiceKeys.CREATE_SCHOOL_USE_CASE       // CreateSchoolUseCase
```

### AppBootstrap

The `AppBootstrap` class initializes all application dependencies once on startup.

```typescript
import { AppBootstrap } from '@/shared/bootstrap';

// Initialize the application
await AppBootstrap.initialize();

// Check if initialized
if (AppBootstrap.isBootstrapped()) {
  // App is ready
}

// Reset (for testing)
AppBootstrap.reset();
```

### Initialization Hook

Use the `initializeApp()` function to safely initialize the app (idempotent):

```typescript
import { initializeApp, initializeAppAndGetService, ServiceKeys } from '@/shared/bootstrap/init';

// Initialize once
await initializeApp();

// Or initialize and get a service in one call
const userRepo = await initializeAppAndGetService(ServiceKeys.USER_REPOSITORY);
```

## Usage Examples

### In API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { initializeAppAndGetService, ServiceKeys } from '@/shared/bootstrap/init';

export async function GET(request: NextRequest) {
  try {
    // Get use case from container
    const getUserUseCase = await initializeAppAndGetService(
      ServiceKeys.GET_USER_BY_EMAIL_USE_CASE
    );

    const result = await getUserUseCase.execute({ email: 'user@example.com' });
    
    if (result.getIsSuccess()) {
      return NextResponse.json(result.getValue());
    }
    
    return NextResponse.json({ error: result.getError() }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### In Server Components

```typescript
import { initializeAppAndGetService, ServiceKeys } from '@/shared/bootstrap/init';

export default async function DashboardPage() {
  const userRepo = await initializeAppAndGetService(ServiceKeys.USER_REPOSITORY);
  const users = await userRepo.findAll();

  return (
    <div>
      {users.map(user => (
        <div key={user.getId()}>{user.getName().getFullName()}</div>
      ))}
    </div>
  );
}
```

### In NextAuth Configuration

```typescript
import { initializeApp, Container, ServiceKeys } from '@/shared/bootstrap';

// In authorize callback
async authorize(credentials) {
  try {
    await initializeApp();
    const userRepository = Container.resolve(ServiceKeys.USER_REPOSITORY);
    
    const user = await userRepository.findByEmail(credentials.email);
    // ... rest of logic
  } catch (error) {
    return null;
  }
}
```

## Adding New Dependencies

### Step 1: Create Your Service

```typescript
// src/domains/my-domain/infrastructure/MyService.ts
export class MyService {
  async doSomething() {
    // Implementation
  }
}
```

### Step 2: Add Service Key

```typescript
// src/shared/bootstrap/AppBootstrap.ts
export const ServiceKeys = {
  // ... existing keys
  MY_SERVICE: 'MY_SERVICE',
};
```

### Step 3: Register in Bootstrap

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

### Step 4: Use in Your Code

```typescript
import { initializeAppAndGetService, ServiceKeys } from '@/shared/bootstrap/init';

const myService = await initializeAppAndGetService(ServiceKeys.MY_SERVICE);
await myService.doSomething();
```

## Best Practices

1. **Always use ServiceKeys**: Don't use string literals for service names

   ```typescript
   // ❌ Bad
   const service = Container.resolve('MY_SERVICE');
   
   // ✅ Good
   import { ServiceKeys } from '@/shared/bootstrap';
   const service = Container.resolve(ServiceKeys.MY_SERVICE);
   ```

2. **Use initializeAppAndGetService**: Simplifies initialization

   ```typescript
   // ❌ More verbose
   await initializeApp();
   const service = Container.resolve(ServiceKeys.MY_SERVICE);
   
   // ✅ Cleaner
   const service = await initializeAppAndGetService(ServiceKeys.MY_SERVICE);
   ```

3. **Register as Singleton**: For stateless services, use singleton for better performance

   ```typescript
   Container.registerSingleton(ServiceKeys.USER_REPOSITORY, () => {
     return new MongoUserRepository();
   });
   ```

4. **Handle Initialization Errors**: Always catch initialization errors

   ```typescript
   try {
     const service = await initializeAppAndGetService(ServiceKeys.MY_SERVICE);
   } catch (error) {
     logger.error('Failed to initialize service', error);
     return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
   }
   ```

5. **Log Service Creation**: Use logger in factories for debugging

   ```typescript
   Container.registerSingleton(ServiceKeys.MY_SERVICE, () => {
     logger.debug('Creating MyService instance');
     return new MyService();
   });
   ```

## Testing

### Reset Container Between Tests

```typescript
import { AppBootstrap } from '@/shared/bootstrap';

describe('My Test', () => {
  afterEach(() => {
    // Clean up between tests
    AppBootstrap.reset();
  });

  it('should initialize app', async () => {
    await AppBootstrap.initialize();
    expect(AppBootstrap.isBootstrapped()).toBe(true);
  });
});
```

### Mock Services for Testing

```typescript
import { Container, ServiceKeys } from '@/shared/bootstrap';

describe('My API', () => {
  it('should use mocked service', async () => {
    const mockRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };
    
    Container.register(ServiceKeys.USER_REPOSITORY, mockRepository);
    
    // ... test code
  });
});
```

## Service Initialization Flow

```
API Request
    ↓
initializeAppAndGetService()
    ↓
AppBootstrap.initialize() (if not already)
    ↓
connectDB()
    ↓
registerRepositories() → MongoUserRepository
    ↓
registerUseCases() → CreateUserUseCase, etc.
    ↓
registerServices() → Custom services
    ↓
Container returns requested service
    ↓
Business logic executed
```

## Environment-Specific Configuration

You can register different implementations based on environment:

```typescript
// src/shared/bootstrap/AppBootstrap.ts
private static registerRepositories(): void {
  if (process.env.NODE_ENV === 'test') {
    Container.registerSingleton(
      ServiceKeys.USER_REPOSITORY,
      () => new MockUserRepository()
    );
  } else {
    Container.registerSingleton(
      ServiceKeys.USER_REPOSITORY,
      () => new MongoUserRepository()
    );
  }
}
```

## Troubleshooting

### Service Not Found Error

```
Error: Dependency not found: USER_REPOSITORY
```

**Solution**: Make sure the service is registered before resolving:

```typescript
// ❌ Wrong - trying to resolve before initialization
const service = Container.resolve(ServiceKeys.USER_REPOSITORY);

// ✅ Correct - initialize first
const service = await initializeAppAndGetService(ServiceKeys.USER_REPOSITORY);
```

### Database Connection Issues

Check MongoDB is running and logs show:

```
[INFO] Connecting to database...
[INFO] Database connected successfully
```

If not, ensure `MONGODB_URI` is set in `.env.local`

### Multiple Initialization Attempts

The system handles this automatically, but you'll see:

```
[INFO] Application bootstrap completed successfully
[DEBUG] Creating MyService instance (called once per singleton)
```

---

For more information, see [architecture.md](./architecture.md)

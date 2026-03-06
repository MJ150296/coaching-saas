# Architecture Overview

## DDD (Domain-Driven Design) Architecture

This project follows Domain-Driven Design principles to create a scalable, maintainable enterprise-grade coaching management system.

### Directory Structure

```
src/
├── domains/                          # Business domains
│   ├── user-management/              # User management domain
│   │   ├── domain/                   # Core domain logic
│   │   │   ├── entities/            # Domain entities (User)
│   │   │   ├── value-objects/       # Value objects (Email, Password, etc.)
│   │   │   ├── repositories/        # Repository interfaces
│   │   │   └── domain-events/       # Domain events
│   │   ├── application/              # Application layer
│   │   │   ├── use-cases/           # Use cases
│   │   │   ├── dtos/                # Data transfer objects
│   │   │   └── mappers/             # Domain to DTO mappers
│   │   └── infrastructure/           # Infrastructure implementation
│   │       ├── persistence/         # MongoDB repository implementations
│   │       └── external-services/   # External service integrations
│   └── organization-management/      # Organization & coaching-center domain
│   ├── academic-management/          # Academic year, class, section, subjects
│   └── fee-management/               # Fee types, plans, ledger, payments
├── shared/                           # Shared code across domains
│   ├── domain/                       # Shared domain classes
│   │   ├── Entity.ts                # Base entity class
│   │   ├── ValueObject.ts           # Base value object class
│   │   ├── AggregateRoot.ts         # Base aggregate root class
│   │   ├── DomainEvent.ts           # Base domain event
│   │   ├── Repository.ts            # Base repository interface
│   │   ├── Specification.ts         # Specification pattern
│   │   └── Result.ts                # Result monad for error handling
│   ├── infrastructure/              # Shared infrastructure
│   │   ├── database.ts              # MongoDB connection
│   │   ├── auth.ts                  # NextAuth configuration
│   │   ├── auth-utils.ts            # Role helpers and redirects
│   │   ├── rbac.ts                  # Permission mapping
│   │   ├── role-policy.ts           # Role creation policy
│   │   ├── tenant.ts                # Tenant enforcement utilities
│   │   ├── audit-log.ts             # Audit log schema + writer
│   │   ├── logger.ts                # Logging interface
│   │   └── errors.ts                # Custom error classes
│   └── lib/                         # Utility functions
│       └── utils.ts                 # Guards, validators, helpers
└── app/                             # Next.js app directory
    ├── api/                         # API routes
    │   ├── auth/                    # Authentication endpoints
    │   ├── admin/                   # Admin APIs (orgs, coaching-centers, users)
    │   └── users/                   # User profile endpoint
    └── ...                          # UI components and pages
```

## Layer Breakdown

### 1. Domain Layer (`domains/*/domain/`)
Pure business logic independent of frameworks. Contains:
- **Entities**: Objects with identity that can change over time
- **Value Objects**: Immutable objects without identity (Email, Password, etc.)
- **Aggregate Roots**: Entry points to aggregates, contain domain logic
- **Domain Events**: Represent significant business events
- **Repositories**: Interface definitions for data persistence
- **Specifications**: Reusable business rules

### 2. Application Layer (`domains/*/application/`)
Orchestrates domain objects to fulfill use cases:
- **Use Cases**: Business scenarios (CreateUser, VerifyEmail, etc.)
- **DTOs**: Simplify data exchange between layers
- **Mappers**: Convert between domain entities and DTOs

### 3. Infrastructure Layer (`domains/*/infrastructure/`)
Implements technical concerns:
- **Persistence**: MongoDB repositories implementation
- **External Services**: Password encryption, email services, etc.

### 4. Shared Layer (`shared/`)
Reusable components across domains:
- Base classes for DDD patterns
- Database connection management
- Authentication configuration
- Logging and error handling

## Key DDD Patterns Used

### 1. **Entity**
Objects with identity that persist over time. Equality is based on ID.

```typescript
const user = new User(id, { email, password, name, role, ... });
```

### 2. **Value Object**
Immutable objects without identity. Equality is based on properties.

```typescript
const email = Email.create('user@example.com');
const password = Password.create('secure-password');
```

### 3. **Aggregate Root**
Entity that acts as entry point to an aggregate. Manages consistency.

```typescript
class User extends AggregateRoot<string> {
  // Domain operations
  changeRole(newRole: UserRole): void { ... }
  activate(): void { ... }
}
```

### 4. **Repository**
Abstraction for object persistence.

```typescript
interface UserRepository extends Repository<User> {
  findByEmail(email: string): Promise<User | null>;
  emailExists(email: string): Promise<boolean>;
}
```

### 5. **Domain Event**
Represents something significant that happened in the domain.

```typescript
const event = new UserCreatedEvent(userId, email, firstName, lastName, role);
user.addDomainEvent(event);
```

### 6. **Use Case**
Orchestrates domain objects to fulfill a business scenario.

```typescript
const useCase = new CreateUserUseCase(userRepository);
const result = await useCase.execute({
  email, password, firstName, lastName, role
});
```

### 7. **Result Pattern**
Functional error handling and success values.

```typescript
const result = await useCase.execute(request);
if (result.getIsFailure()) {
  const error = result.getError();
  // handle error
} else {
  const value = result.getValue();
  // use value
}
```

## Authentication Flow

### NextAuth Integration
- **Provider**: Credentials (email/password)
- **Strategy**: JWT
- **Session Duration**: 30 days

### Registration Flow (Admin-Only)
1. POST `/api/auth/register` with credentials (authenticated admin only)
2. Role creation policy is validated
3. Tenant scope is enforced for non-superadmin users
4. Password hashed with bcryptjs (SALT_ROUNDS = 10)
5. User created via CreateUserUseCase and stored in MongoDB

### Sign-in Flow
1. NextAuth credentials provider validates email/password
2. JWT token generated and returned
3. Session established via `/api/auth/[...nextauth]`

### Current User
1. GET `/api/users/me`
2. Validates JWT token
3. Fetches user from MongoDB
4. Returns user data

## Database

### MongoDB Connection
- Uses Mongoose ODM
- Connection pooling with cached singleton
- Automatic connection reuse in serverless environment

### User Schema
- Indexed on: email, role, isActive
- Timestamps: createdAt, updatedAt
- Role enum: SUPER_ADMIN, ORGANIZATION_ADMIN, COACHING_ADMIN, ADMIN, TEACHER, STUDENT, PARENT, STAFF
- Tenant fields: organizationId, schoolId (required for non-superadmin)

## Academic and Fee Domains

The academic and fee domains provide minimal create APIs for:

- Academic year, class master, section, subject allocation
- Fee types, fee plans, fee plan assignments
- Student fee ledger entries, payments, credit notes

All resources are scoped by `organizationId`, `schoolId`, and `academicYearId` where applicable.

## Future Domains (Not Implemented)

Examples you can add later:
- Student management
- Class management
- Assessment and grading

## Best Practices

1. **Dependency Injection**: Use constructor injection for dependencies
2. **Result Pattern**: Use Result monad instead of throwing exceptions
3. **Immutability**: Value objects are frozen after creation
4. **Domain Events**: Publish events for async operations
5. **Separation of Concerns**: Each layer has clear responsibilities
6. **Type Safety**: Full TypeScript with strict mode
7. **Edge Cases**: Guard clauses prevent invalid states
8. **Testing**: Domain logic is independent and testable

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/coaching-saas
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
```

## Running the Project

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start MongoDB
# mongod

# Run development server
npm run dev

# Open http://localhost:3000
```

## Extending the Architecture

To add a new domain (e.g., `student-management`):

1. Create `src/domains/student-management/domain/` with entities, repositories, events
2. Create `src/domains/student-management/application/` with use cases
3. Create `src/domains/student-management/infrastructure/` with persistence and services
4. Register repositories and use cases in `src/shared/bootstrap/AppBootstrap.ts`
5. Create API routes in `src/app/api/`

Each domain is independent but can communicate through:
- **Domain Events**: Async communication
- **Repositories**: Access other aggregates if needed
- **Shared Utilities**: Common validation and types

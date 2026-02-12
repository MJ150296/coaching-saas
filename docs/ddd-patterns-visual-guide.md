# DDD Concepts & Patterns Visual Guide

## 1. Core DDD Concepts

### Domain
A specific business area with its own language and rules.

```
Domain Example: User Management
├─ Language
│  ├─ "Create a user"
│  ├─ "Change user role"
│  ├─ "Verify email"
│  └─ "Deactivate user"
│
├─ Rules
│  ├─ Email must be unique
│  ├─ Password must be hashed
│  ├─ Role must be from predefined list
│  └─ User must be activated before use
│
└─ Actors
   ├─ SuperAdmin: Can manage everything
   ├─ OrgAdmin: Can manage organization
   ├─ SchoolAdmin: Can manage school
   └─ Teacher: Can view own data
```

### Ubiquitous Language

The shared vocabulary between business stakeholders and developers.

```
Business says: "Register a new teacher with email, password, and assign role"

Developers translate to:
- Domain: "Create User entity with Email, Password value objects"
- Application: "CreateUserUseCase"
- Database: "INSERT INTO users table"

WRONG ❌:
- Using different terms in code (UserModel, createAccount, addTeacher)
- Hiding domain logic in database or UI layer

CORRECT ✅:
- Domain entities use business terms
- Use cases match business processes
- Class names reflect domain language
```

---

## 2. Entity vs Value Object

### Entity

**Identity**: Has unique ID, exists independently

```typescript
class User extends AggregateRoot {
  private readonly id: string;           // ← Unique identity
  private email: Email;                  // Value object
  private password: Password;            // Value object
  private role: UserRole;                // Enum (value object concept)
  
  // Two users are equal if they have same ID
  // User {id: 1, email: 'a@b.com'} ≠ User {id: 2, email: 'a@b.com'}
}
```

**Characteristics**:
- Has identity (unique ID)
- Can change properties over time
- Lifecycle: Created → Modified → Deleted
- Business meaning (User, Order, Invoice)

**Example Flow**:
```
1. Create User with ID "user-1"
2. Change Email from a@b.com to c@d.com
3. User is still "user-1" (same identity)
4. Later delete User "user-1"
```

### Value Object

**No Identity**: Only value matters

```typescript
class Email extends ValueObject {
  private readonly value: string;        // No ID needed
  
  // Two Emails are equal if they have same value
  // Email: 'a@b.com' = Email: 'a@b.com'  (even if created separately)
}
```

**Characteristics**:
- No unique ID (value is identity)
- Immutable (can't change)
- No lifecycle
- Describes properties of entities

**Examples**:
```
✅ VALUE OBJECTS:
  - Email, Password, PhoneNumber (value-only)
  - Money amount, Currency
  - Address (street, city, zip)
  - Color, Rating
  
❌ NOT VALUE OBJECTS:
  - User, Product, Order (need identity)
  - Account, Invoice (need lifecycle)
```

**Value Object Implementation Pattern**:

```typescript
// src/domains/user-management/domain/value-objects/index.ts

export class Email extends ValueObject {
  private readonly value: string;

  private constructor(value: string) {
    super();
    this.value = value;
  }

  static create(email: string): Result<Email> {
    // Validation
    if (!email || !this.isValidEmail(email)) {
      return Result.fail('Invalid email format');
    }

    // Return value object
    return Result.ok(new Email(email.toLowerCase().trim()));
  }

  getValue(): string {
    return this.value;
  }

  private static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

---

## 3. Aggregate & Aggregate Root

### What's an Aggregate?

Group of related entities and value objects that work together.

```
User Aggregate
├─ User Entity (Aggregate Root)
│  ├─ Email Value Object
│  ├─ Password Value Object
│  ├─ UserName Value Object
│  └─ UserPhone Value Object
│
└─ Invariants (Business Rules)
   ├─ Email must be unique
   ├─ Password must be hashed
   ├─ Status must be ACTIVE or INACTIVE
   └─ Role must be valid
```

### Aggregate Root

The entity that's responsible for maintaining aggregate consistency.

```typescript
class User extends AggregateRoot<UserProps> {
  // ❌ WRONG: Public methods allow breaking rules
  public email: Email;  // Anyone can change!

  // ✅ CORRECT: Private with methods that enforce rules
  private email: Email;
  
  changeEmail(newEmail: string): Result<void> {
    const emailResult = Email.create(newEmail);
    if (emailResult.isFail) {
      return Result.fail('Invalid email');
    }
    this.email = emailResult.getValue();
    return Result.ok();
  }

  // Domain events when important things happen
  verifyEmail(): void {
    this.emailVerified = true;
    this.addDomainEvent(new UserEmailVerifiedEvent(this.id));
  }
}
```

**Key Principle**: Only access aggregates through their root.

```typescript
// ❌ WRONG: Accessing nested parts directly
user.email.value = 'hacked@evil.com';  // Breaks rules!

// ✅ CORRECT: Using aggregate root method
user.changeEmail('safe@domain.com');   // Validates through root
```

---

## 4. Repository Pattern

**Purpose**: Abstract data access, not database queries

```typescript
// Repository Interface (Domain Layer)
export interface UserRepository extends Repository<User> {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  emailExists(email: string): Promise<boolean>;
  findByRole(role: UserRole): Promise<User[]>;
}
```

**Why Not Just Use Database Directly?**

```typescript
// ❌ WRONG: Business logic knows about database
async function createUser(email: string) {
  // This is in the use case
  const exists = await database.query(
    'SELECT COUNT(*) FROM users WHERE email = ?', 
    [email]
  );  // ← Tightly coupled to database!

  if (exists > 0) return fail('Email exists');
  
  await database.query(
    'INSERT INTO users (email) VALUES (?)',
    [email]
  );  // ← Different query syntax for different DB!
}

// ✅ CORRECT: Business logic uses repository abstraction
async function createUser(email: string) {
  const exists = await userRepository.emailExists(email);
  if (exists) return fail('Email exists');
  
  await userRepository.save(user);
  // Same code works with MongoDB, PostgreSQL, File system!
}
```

**Repository Implementation**:

```typescript
// MongoDB Implementation
export class MongoUserRepository implements UserRepository {
  async findByRole(role: UserRole): Promise<User[]> {
    const documents = await UserModel.find({ role });
    return documents.map(doc => this.toDomainEntity(doc));
  }
}

// PostgreSQL Implementation (future)
export class PostgresUserRepository implements UserRepository {
  async findByRole(role: UserRole): Promise<User[]> {
    const documents = await database.query(
      'SELECT * FROM users WHERE role = ?', 
      [role]
    );
    return documents.map(doc => this.toDomainEntity(doc));
  }
}

// Both are called the same way in business logic!
const users = await repository.findByRole('TEACHER');
```

---

## 5. Use Cases (Application Layer)

**Purpose**: Orchestrate domain logic for specific business scenarios

```
Use Case = One thing a user can do in the system

Examples:
- Register New User
- Change User Role
- Verify User Email
- Deactivate User Account
- Search Users by Name
- Calculate Student Grade Average
```

### Use Case Structure

```typescript
export class CreateUserUseCase {
  // Dependencies injected (not created here)
  constructor(private userRepository: UserRepository) {}

  // Input data (request)
  async execute(request: CreateUserRequest): Promise<Result<UserResponseDTO>> {
    // 1. VALIDATE Input
    if (!request.email || !request.password) {
      return Result.fail('Missing required fields');
    }

    // 2. CHECK Business Rules
    const exists = await this.userRepository.emailExists(request.email);
    if (exists) {
      return Result.fail('Email already in use');
    }

    // 3. CREATE Domain Entity (pure business logic)
    const userResult = User.create({
      email: Email.create(request.email),
      password: Password.create(request.password),
      name: UserName.create(request.firstName, request.lastName),
      role: UserRole.STUDENT,  // Default role
    });
    if (userResult.isFail) {
      return Result.fail(userResult.getError());
    }

    // 4. PERSIST (save to database)
    const user = userResult.getValue();
    await this.userRepository.save(user);

    // 5. RETURN Response
    return Result.ok(UserMapper.toDTO(user));
  }
}
```

**Use Case = User Action**

```
User Action: "I want to register as a teacher"
                         ↓
                    Use Case
                         ↓
        CreateUserUseCase.execute({
          email: 'teacher@school.com',
          password: 'secure123',
          firstName: 'John',
          lastName: 'Doe'
        })
                         ↓
              Validates inputs
                         ↓
              Creates domain entity
                         ↓
              Persists to database
                         ↓
              Returns DTO to controller
                         ↓
        HTTP 201 Created {
          user: { id, email, role, ... }
        }
```

---

## 6. Domain Events

**Purpose**: Record important things that happen in the domain

```typescript
// When user changes role, important!
// - HR system needs to know (send email)
// - Analytics needs to track (log event)
// - Permissions need update (clear cache)

class User extends AggregateRoot {
  changeRole(newRole: UserRole): void {
    this.role = newRole;
    
    // Record that this happened
    this.addDomainEvent(
      new UserRoleChangedEvent(this.id, newRole, new Date())
    );
  }
}

// Later, event handlers can react
class UserRoleChangedEventHandler {
  handle(event: UserRoleChangedEvent) {
    emailService.send(`Role changed to ${event.newRole}`);
    analyticsService.track('user.role.changed', event);
    permissionCache.invalidate(event.userId);
  }
}
```

**Benefits**:
- All changes are recorded
- Side effects isolated in handlers
- Easy to add new reactions later
- Supports audit trail and notifications

---

## 7. Specification Pattern

**Purpose**: Encapsulate complex business rules

```typescript
// Instead of spreading conditions everywhere
// ❌ WRONG
const activeTeachers = users.filter(
  u => u.role === 'TEACHER' && u.isActive && u.emailVerified
);

// ✅ CORRECT: Encapsulate in specification
class ActiveTeacherSpecification extends Specification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.getRole() === UserRole.TEACHER &&
           user.isActive() &&
           user.isEmailVerified();
  }
}

// Use it
const spec = new ActiveTeacherSpecification();
const activeTeachers = users.filter(u => spec.isSatisfiedBy(u));

// Compose specifications
const newSpecification = spec.and(new InSchoolSpecification('school-1'));
const activeTeachersInSchool = users.filter(u => newSpecification.isSatisfiedBy(u));
```

---

## 8. Result Pattern (Functional Error Handling)

**Purpose**: Handle success/failure without exceptions

```typescript
// Instead of throwing exceptions everywhere
// ❌ WRONG
function createUser(email: string): User {
  if (!email) throw new Error('Email required');
  if (await userExists(email)) throw new Error('Email exists');
  return new User(email);
}

// ✅ CORRECT: Return Result
function createUser(email: string): Result<User> {
  if (!email) {
    return Result.fail('Email required');
  }
  
  if (await userExists(email)) {
    return Result.fail('Email exists');
  }
  
  return Result.ok(new User(email));
}

// Using it
const result = await createUserUseCase.execute(request);

if (result.isSuccess) {
  const user = result.getValue();
  // Use user
} else {
  const error = result.getError();
  // Handle error
}

// Or with fold (functional approach)
return result.fold(
  error => sendErrorResponse(error),      // On failure
  user => sendSuccessResponse(user)        // On success
);
```

**Benefits**:
- No silent failures
- Explicit error handling
- Functional composition
- Type-safe error paths

---

## 9. Layering Architecture

```
┌──────────────────────────────────────────────────┐
│         UI / API Routes / Controllers            │
│  (Express your requirements to the system)       │
└────────────────────────────────────────────────┬─┘
                                                  │
                 What user wants
                                                  │
┌────────────────────────────────────────────────▼─┐
│        Application (Use Cases Layer)             │
│  (Orchestrate domain logic for use cases)        │
│  - CreateUserUseCase                             │
│  - ChangeUserRoleUseCase                         │
│  - VerifyUserEmailUseCase                        │
└────────────────────────────────────────────────┬─┘
                                                  │
              How to do it (business rules)
                                                  │
┌────────────────────────────────────────────────▼─┐
│       Domain (Pure Business Logic)               │
│  (What the system is fundamentally about)        │
│  - User Entity                                   │
│  - Email, Password Value Objects                 │
│  - UserRepository Interface                      │
│  - Business Rules & Invariants                   │
│  - Domain Events                                 │
└────────────────────────────────────────────────┬─┘
                                                  │
         How to technically implement it
                                                  │
┌────────────────────────────────────────────────▼─┐
│    Infrastructure (Technical Implementation)    │
│  (How to store, send messages, etc.)            │
│  - MongoUserRepository                          │
│  - UserSchema (Mongoose)                        │
│  - PasswordEncryption (bcryptjs)                │
│  - Database Connection                          │
└──────────────────────────────────────────────────┘
        ↓
    MongoDB/PostgreSQL/File System
```

### Dependency Direction

```
UI/Routes depend on → Application depend on → Domain
                                                ↑
                                         Independent of
Shared Infrastructure (optional) ←────────────────┘
```

**Rule**: Inner layers should NOT depend on outer layers.

```typescript
// ❌ WRONG: Domain knows about database
class User {
  save() {
    database.query('INSERT INTO users...');  // WRONG!
  }
}

// ✅ CORRECT: Repository handles persistence
class User {
  // User doesn't know how it's saved
}

class MongoUserRepository implements UserRepository {
  save(user: User) {
    // Database operations here
  }
}
```

---

## 10. Dependency Injection Pattern

**Purpose**: Make components testable and flexible

```typescript
// ❌ WRONG: Tightly coupled
class CreateUserUseCase {
  constructor() {
    // Hard-coded dependency
    this.repository = new MongoUserRepository();
  }
}

// ❌ WRONG: Hard to test
const useCase = new CreateUserUseCase();  // Always uses MongoDB!

// ✅ CORRECT: Injected dependency
class CreateUserUseCase {
  constructor(private repository: UserRepository) {
    // Can receive any implementation
  }
}

// Flexible: Can use different implementations
const mongoRepo = new MongoUserRepository();
const useCase1 = new CreateUserUseCase(mongoRepo);  // Uses MongoDB

const inMemoryRepo = new InMemoryUserRepository();
const useCase2 = new CreateUserUseCase(inMemoryRepo);  // Uses memory

// Easy to test
const mockRepo = new MockUserRepository();
const useCase3 = new CreateUserUseCase(mockRepo);  // Uses test double
```

### Service Container Pattern

```typescript
const container = new Container();

// Register implementations
container.registerSingleton(
  ServiceKeys.USER_REPOSITORY,
  () => new MongoUserRepository()
);

container.registerSingleton(
  ServiceKeys.CREATE_USER_USE_CASE,
  () => new CreateUserUseCase(
    container.resolve(ServiceKeys.USER_REPOSITORY)
  )
);

// Later, resolve
const useCase = container.resolve(ServiceKeys.CREATE_USER_USE_CASE);
```

---

## 11. Data Flow Example: Complete User Registration

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER Interface                                               │
│    User fills out form and clicks "Register"                   │
│    Email: teacher@school.com                                   │
│    Password: SecurePass123!                                    │
│    FirstName: John                                             │
│    LastName: Doe                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API Route (src/app/api/auth/register/route.ts)             │
│    POST /api/auth/register                                     │
│    - Parse JSON                                                │
│    - Validate required fields                                  │
│    - Hash password: bcryptjs.hash()                            │
│    - Resolve CreateUserUseCase from Container                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Application Layer (CreateUserUseCase)                        │
│    execute({                                                    │
│      email: 'teacher@school.com',                              │
│      password: '$2b$10$...' (hashed),                          │
│      firstName: 'John',                                        │
│      lastName: 'Doe'                                           │
│    })                                                           │
│                                                                 │
│    - Check if email exists:                                    │
│      const exists = repository.emailExists(email)              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                      (calls repository)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Infrastructure Layer (MongoUserRepository)                   │
│    emailExists('teacher@school.com')                           │
│    - Query MongoDB:                                            │
│      UserModel.findOne({ email: 'teacher@school.com' })        │
│    - Return: false (doesn't exist)                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                    (returns to use case)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Domain Layer (Entity Creation)                              │
│    Back in CreateUserUseCase:                                  │
│                                                                 │
│    Create value objects:                                       │
│    - Email.create('teacher@school.com')                        │
│      └─ Validates email format ✓                              │
│    - Password.create('$2b$10$...', true)                       │
│      └─ Marks as hashed ✓                                     │
│    - UserName.create('John', 'Doe')                            │
│      └─ Validates not empty ✓                                 │
│                                                                 │
│    Create aggregate root:                                      │
│    - User.create({                                             │
│        id: generateId(),                                       │
│        email: EmailValueObject,                               │
│        password: PasswordValueObject,                         │
│        name: UserNameValueObject,                             │
│        role: UserRole.STUDENT,                                │
│        isActive: true,                                        │
│        emailVerified: false                                   │
│      })                                                        │
│      └─ All invariants satisfied ✓                            │
│                                                                 │
│    Emit domain event:                                          │
│    - user.addDomainEvent(                                      │
│        new UserCreatedEvent(user.id, user.email)              │
│      )                                                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Persistence (Infrastructure)                                │
│    repository.save(user)                                       │
│                                                                 │
│    - Transform domain entity to persistence format:            │
│      {                                                          │
│        _id: 'usr-1739001234567-abc',                           │
│        email: 'teacher@school.com',                            │
│        password: '$2b$10$...',                                 │
│        firstName: 'John',                                      │
│        lastName: 'Doe',                                        │
│        role: 'STUDENT',                                        │
│        isActive: true,                                         │
│        emailVerified: false,                                   │
│        createdAt: 2025-02-08T...,                              │
│        updatedAt: 2025-02-08T...                               │
│      }                                                          │
│                                                                 │
│    - Insert into MongoDB:                                      │
│      db.users.insertOne({...})                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Response (Back to API Route)                                │
│    useCase.execute() returns:                                  │
│    Result.ok(UserResponseDTO {                                │
│      id: 'usr-1739001234567-abc',                             │
│      email: 'teacher@school.com',                             │
│      firstName: 'John',                                       │
│      lastName: 'Doe',                                         │
│      role: 'STUDENT',                                         │
│      isActive: true,                                          │
│      emailVerified: false                                     │
│    })                                                          │
│                                                                 │
│    Return HTTP 201 Created                                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Browser Response                                            │
│    HTTP 201 Created                                            │
│    Content-Type: application/json                              │
│                                                                 │
│    {                                                            │
│      "user": {                                                 │
│        "id": "usr-1739001234567-abc",                         │
│        "email": "teacher@school.com",                         │
│        "firstName": "John",                                   │
│        "lastName": "Doe",                                     │
│        "role": "STUDENT",                                     │
│        "isActive": true,                                      │
│        "emailVerified": false                                 │
│      }                                                         │
│    }                                                            │
│                                                                 │
│    Browser:                                                    │
│    1. Auto sign-in with NextAuth                              │
│    2. Set session cookie                                      │
│    3. Redirect to /dashboard                                  │
│    4. User is now authenticated!                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: Why This Architecture?

```
✅ TESTABILITY
   - Domain logic has no dependencies
   - Easy to test with mock repositories

✅ MAINTAINABILITY
   - Clear separation of concerns
   - Business rules in one place
   - Easy to find and fix bugs

✅ SCALABILITY
   - Easy to add new domains
   - Easy to add new use cases
   - Can change database without touching business logic

✅ TEAM COLLABORATION
   - Clear patterns to follow
   - Alice writes domain, Bob writes API
   - No confusion about responsibilities

✅ BUSINESS ALIGNMENT
   - Code reflects business language
   - Non-technical stakeholders understand structure
   - Domain experts can validate rules

✅ FLEXIBILITY
   - Easy to change implementations
   - Supports multiple databases
   - Can add features without breaking existing code
```

Keep these principles in mind when extending the system! 🎯

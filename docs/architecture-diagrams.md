# System Architecture Diagram

## High-Level Architecture

Note: `POST /api/auth/register` is admin-only; public self-registration is disabled.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                                      │
│                    (Next.js Client Components)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐      ┌──────────────┐      ┌────────────────┐             │
│  │  Sign In    │      │  Register    │      │    Protected   │             │
│  │  Page       │      │  Page        │      │    Pages       │             │
│  └──────┬──────┘      └──────┬───────┘      └────────┬───────┘             │
│         │                    │                      │                       │
│         └────────────────────┼──────────────────────┘                       │
│                              │                                              │
│                    API Calls (HTTP/JSON)                                    │
│                              ▼                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    NEXT.JS SERVER (App Router)                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     API Routes Layer                               │    │
│  │                                                                    │    │
│  │  POST /api/auth/register ──┐                                      │    │
│  │  POST /api/auth/signin     ├──► NextAuth Handler                 │    │
│  │  GET  /api/auth/session   ─┘                                      │    │
│  │                                                                    │    │
│  │  GET  /api/users/me ────────────┐                                │    │
│  │  POST /api/users/update ────────┼──► User Routes                 │    │
│  │  GET  /api/users/list ──────────┘                                │    │
│  └────────────┬───────────────────────────────────────────────────┬─┘    │
│               │                                                   │        │
│               │        initializeAppAndGetService()               │        │
│               │        (Bootstrap & Dependency Injection)         │        │
│               ▼                                                   ▼        │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                  Bootstrap System                              │        │
│  │                  (src/shared/bootstrap/)                       │        │
│  │                                                                │        │
│  │  ┌──────────────────────────────────────────────────────┐    │        │
│  │  │              AppBootstrap.initialize()               │    │        │
│  │  │                                                      │    │        │
│  │  │  1. Connect to MongoDB                              │    │        │
│  │  │  2. Register Repositories (Singleton)               │    │        │
│  │  │  3. Register Use Cases (Singleton)                  │    │        │
│  │  │  4. Register Services (Custom)                      │    │        │
│  │  └──────────────────────────────────────────────────────┘    │        │
│  │                           │                                  │        │
│  │                           ▼                                  │        │
│  │  ┌──────────────────────────────────────────────────────┐    │        │
│  │  │         Service Container (Singleton)                │    │        │
│  │  │                                                      │    │        │
│  │  │  ServiceKeys.USER_REPOSITORY                        │    │        │
│  │  │  → MongoUserRepository instance                     │    │        │
│  │  │                                                      │    │        │
│  │  │  ServiceKeys.CREATE_USER_USE_CASE                   │    │        │
│  │  │  → CreateUserUseCase instance                       │    │        │
│  │  │                                                      │    │        │
│  │  │  ServiceKeys.GET_USER_BY_EMAIL_USE_CASE             │    │        │
│  │  │  → GetUserByEmailUseCase instance                   │    │        │
│  │  │                                                      │    │        │
│  │  └────────────────────────────┬─────────────────────────┘    │        │
│  └─────────────────────────────────────────────────────────────┘        │
│              │                                                          │
│              │ Container.resolve(ServiceKey)                          │
│              │                                                         │
│              ▼                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              Business Logic Layer (Use Cases)                  │   │
│  │           (src/domains/*/application/use-cases/)              │   │
│  │                                                                │   │
│  │  CreateUserUseCase.execute()                                  │   │
│  │    ├─ Validate input                                          │   │
│  │    ├─ Check if email exists (via UserRepository)             │   │
│  │    ├─ Create User domain entity with value objects           │   │
│  │    ├─ Persist to database                                    │   │
│  │    └─ Return Result<success | failure>                       │   │
│  │                                                                │   │
│  │  GetUserByEmailUseCase.execute()                              │   │
│  │    ├─ Query database via UserRepository                      │   │
│  │    ├─ Map domain entity to DTO                               │   │
│  │    └─ Return Result<user | error>                            │   │
│  │                                                                │   │
│  │  VerifyUserEmailUseCase.execute()                             │   │
│  │    ├─ Load user from repository                              │   │
│  │    ├─ Call domain method: user.verifyEmail()                 │   │
│  │    └─ Persist changes                                        │   │
│  └────────────────┬──────────────────────────────────────────────┘   │
│                   │                                                  │
│                   ▼                                                  │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │              Domain Layer (Pure Business Logic)               │   │
│  │           (src/domains/*/domain/)                             │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  User (Aggregate Root)                                 │  │   │
│  │  │                                                        │  │   │
│  │  │  Properties:                                          │  │   │
│  │  │  - id: string                                         │  │   │
│  │  │  - email: Email (Value Object)                        │  │   │
│  │  │  - password: Password (Value Object)                  │  │   │
│  │  │  - name: UserName (Value Object)                      │  │   │
│  │  │  - phone: UserPhone (Value Object)                    │  │   │
│  │  │  - role: UserRole (Enum)                              │  │   │
│  │  │  - isActive: boolean                                  │  │   │
│  │  │  - emailVerified: boolean                             │  │   │
│  │  │                                                        │  │   │
│  │  │  Methods:                                             │  │   │
│  │  │  + create()                                           │  │   │
│  │  │  + changeRole()         ──► triggers event            │  │   │
│  │  │  + activate()           ──► triggers event            │  │   │
│  │  │  + deactivate()         ──► triggers event            │  │   │
│  │  │  + verifyEmail()        ──► triggers event            │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  Domain Events                                         │  │   │
│  │  │  - UserCreatedEvent                                   │  │   │
│  │  │  - UserActivatedEvent                                 │  │   │
│  │  │  - UserDeactivatedEvent                               │  │   │
│  │  │  - UserRoleChangedEvent                               │  │   │
│  │  │  - UserEmailVerifiedEvent                             │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  Repository Interface (abstraction)                    │  │   │
│  │  │                                                        │  │   │
│  │  │  + save(user: User): Promise<void>                    │  │   │
│  │  │  + findById(id: string): Promise<User | null>         │  │   │
│  │  │  + findByEmail(email: string): Promise<User | null>  │  │   │
│  │  │  + findAll(): Promise<User[]>                         │  │   │
│  │  │  + delete(id: string): Promise<void>                 │  │   │
│  │  │  + emailExists(email: string): Promise<boolean>      │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              │                                         │
│                              ▼                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                   Infrastructure Layer                                  │
│            (src/domains/*/infrastructure/)                              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  MongoDB Persistence (Concrete Implementation)                  │   │
│  │                                                                 │   │
│  │  MongoUserRepository implements UserRepository                 │   │
│  │    - save()      └──► UserModel.findByIdAndUpdate()          │   │
│  │    - findById()  └──► UserModel.findById()                   │   │
│  │    - findByEmail()─► UserModel.findOne({email})              │   │
│  │    - findAll()   └──► UserModel.find()                       │   │
│  │    - delete()    └──► UserModel.findByIdAndDelete()          │   │
│  │                                                                 │   │
│  │    ┌─────────────────────────────────────────────────────┐    │   │
│  │    │  Mongoose User Schema                              │    │   │
│  │    │                                                     │    │   │
│  │    │  _id: String (Primary Key)                         │    │   │
│  │    │  email: String (Unique Index)                      │    │   │
│  │    │  password: String (Hashed)                         │    │   │
│  │    │  firstName: String                                 │    │   │
│  │    │  lastName: String                                  │    │   │
│  │    │  phone: String (Optional)                          │    │   │
│  │    │  role: Enum [SUPER_ADMIN, ORG_ADMIN, ...]         │    │   │
│  │    │  isActive: Boolean (Index)                         │    │   │
│  │    │  emailVerified: Boolean                            │    │   │
│  │    │  timestamps: {createdAt, updatedAt}                │    │   │
│  │    │  indexes: {email, role, isActive}                  │    │   │
│  │    └─────────────────────────────────────────────────────┘    │   │
│  │                                                                 │   │
│  └──────────────────────────────────────┬──────────────────────────┘   │
│  ┌──────────────────────────────────────┴──────────────────────────┐   │
│  │  External Services                                             │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  PasswordEncryption                                    │   │   │
│  │  │  - hash(password: string): Promise<string>            │   │   │
│  │  │  - compare(plain, hash): Promise<boolean>             │   │   │
│  │  │    Uses: bcryptjs (10 salt rounds)                    │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  Database Connection                                  │   │   │
│  │  │  - connectDB(): Promise<void>                         │   │   │
│  │  │  - Singleton pattern: reuse connection               │   │   │
│  │  │  - Supports local MongoDB & Atlas                    │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  NextAuth Configuration                               │   │   │
│  │  │  - Credentials Provider (email/password)              │   │   │
│  │  │  - JWT Sessions (30 days)                             │   │   │
│  │  │  - Custom callbacks (authorize, session, jwt)         │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                              ▼                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
           ┌────────────────────────────────────┐
           │     MONGODB DATABASE                │
           │  (Atlas or Local)                  │
           │                                    │
           │  Collections:                      │
           │  - users                           │
           │  - students (future)               │
           │  - classes (future)                │
           │  - grades (future)                 │
           │  ...                               │
           └────────────────────────────────────┘
```

---

## Data Flow Example: User Registration

```
1. USER INTERACTION
   ┌─────────────────────────────┐
   │  User clicks "Register"     │
   │  Fills form with:           │
   │  - email                    │
   │  - password                 │
   │  - firstName                │
   │  - lastName                 │
   │  - phone (optional)         │
   └──────────────┬──────────────┘
                  │
                  ▼
2. API REQUEST
   ┌─────────────────────────────┐
   │  POST /api/auth/register    │
   │  Body: {email, password,    │
   │         firstName, lastName}│
   └──────────────┬──────────────┘
                  │
                  ▼
3. REQUEST HANDLER
   ┌──────────────────────────────────────────┐
   │  route.ts handler()                      │
   │  1. Parse request JSON                   │
   │  2. Validate required fields             │
   │  3. Hash password with bcryptjs          │
   │  4. Resolve UseCase from container       │
   │     ↓                                    │
   │     initializeAppAndGetService()         │
   │     ├─ AppBootstrap.initialize()         │
   │     └─ Container.resolve(CREATE_USER)    │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
4. USE CASE EXECUTION
   ┌──────────────────────────────────────────┐
   │  CreateUserUseCase.execute()             │
   │  1. Check if email already exists        │
   │     ├─ userRepository.emailExists()      │
   │     └─ Query MongoDB                     │
   │  2. If exists: return Result.fail()      │
   │  3. If new: Create domain entities       │
   │     ├─ Email.create(email)               │
   │     ├─ Password.create(hashedPwd)        │
   │     ├─ UserName.create(first, last)      │
   │     └─ User.create(id, email, ...)       │
   │  4. Persist to database                  │
   │     └─ userRepository.save(user)         │
   │  5. Return Result.ok(user)               │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
5. REPOSITORY OPERATION
   ┌──────────────────────────────────────────┐
   │  MongoUserRepository.save()              │
   │  1. Transform domain to persistence      │
   │     {                                    │
   │       _id: "unique-id",                  │
   │       email: "user@example.com",         │
   │       password: "$2b$10$...",            │
   │       firstName: "John",                 │
   │       lastName: "Doe",                   │
   │       role: "STUDENT",                   │
   │       isActive: true,                    │
   │       emailVerified: false               │
   │     }                                    │
   │  2. Call Mongoose: UserModel.            │
   │     findByIdAndUpdate()                  │
   │  3. MongoDB stores document              │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
6. DATABASE STORAGE
   ┌──────────────────────────────────────────┐
   │  MongoDB                                 │
   │  db.users collection                     │
   │                                          │
   │  {                                       │
   │    "_id": "1739001234567-abc123",        │
   │    "email": "user@example.com",          │
   │    "password": "$2b$10$...",             │
   │    "firstName": "John",                  │
   │    "lastName": "Doe",                    │
   │    "phone": null,                        │
   │    "role": "STUDENT",                    │
   │    "isActive": true,                     │
   │    "emailVerified": false,               │
   │    "createdAt": "2026-02-08T...",        │
   │    "updatedAt": "2026-02-08T..."         │
   │  }                                       │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
7. RESPONSE
   ┌──────────────────────────────────────────┐
   │  HTTP 201 Created                        │
   │  {                                       │
   │    "user": {                             │
   │      "id": "1739001234567-abc123",       │
   │      "email": "user@example.com",        │
   │      "firstName": "John",                │
   │      "lastName": "Doe",                  │
   │      "role": "STUDENT",                  │
   │      "isActive": true,                   │
   │      "emailVerified": false,             │
   │      ...                                 │
   │    }                                     │
   │  }                                       │
   └──────────────┬──────────────────────────┘
                  │
                  ▼
8. CLIENT HANDLING
   ┌──────────────────────────────────────────┐
   │  Response received                       │
   │  Auto sign-in with NextAuth              │
   │  Redirect to /dashboard                  │
   │  User is authenticated!                  │
   └──────────────────────────────────────────┘
```

---

## Class Hierarchy

```
Entity (abstract)
  ├─ User (extends AggregateRoot)
  │   ├─ id: string
  │   ├─ email: Email
  │   ├─ password: Password
  │   ├─ name: UserName
  │   ├─ phone?: UserPhone
  │   ├─ role: UserRole
  │   ├─ isActive: boolean
  │   ├─ emailVerified: boolean
  │   │
  │   ├─ Methods:
  │   ├─ create() → static
  │   ├─ getEmail() → Email
  │   ├─ getPassword() → Password
  │   ├─ getName() → UserName
  │   ├─ getRole() → UserRole
  │   ├─ changeRole(newRole)
  │   ├─ activate()
  │   ├─ deactivate()
  │   └─ verifyEmail()
  │
  └─ (other entities: Student, Class, etc.)

ValueObject (abstract)
  ├─ Email
  │   ├─ value: string
  │   ├─ create(email) →  static
  │   └─ getValue() → string
  │
  ├─ Password
  │   ├─ value: string
  │   ├─ isHashed: boolean
  │   ├─ create(pwd, isHashed?) → static
  │   └─ getValue() → string
  │
  ├─ UserName
  │   ├─ firstName: string
  │   ├─ lastName: string
  │   ├─ create(first, last) → static
  │   ├─ getFirstName() → string
  │   ├─ getLastName() → string
  │   └─ getFullName() → string
  │
  ├─ UserPhone
  │   ├─ value: string
  │   ├─ create(phone) → static
  │   └─ getValue() → string
  │
  └─ (other value objects)

AggregateRoot (extends Entity)
  ├─ domainEvents: DomainEvent[]
  ├─ addDomainEvent()
  ├─ getDomainEvents()
  └─ clearDomainEvents()

DomainEvent (abstract)
  ├─ UserCreatedEvent
  ├─ UserActivatedEvent
  ├─ UserDeactivatedEvent
  └─ UserRoleChangedEvent

UseCase (pattern)
  ├─ CreateUserUseCase
  │   ├─ constructor(userRepository)
  │   └─ execute(request) → Promise<Result>
  │
  ├─ GetUserByEmailUseCase
  │   ├─ constructor(userRepository)
  │   └─ execute(request) → Promise<Result>
  │
  └─ VerifyUserEmailUseCase
      ├─ constructor(userRepository)
      └─ execute(request) → Promise<Result>

Repository (interface)
  └─ UserRepository (extends Repository<User>)
      ├─ save()
      ├─ findById()
      ├─ findByEmail()
      ├─ findAll()
      ├─ emailExists()
      ├─ findByRole()
      ├─ findAllActive()
      └─ MongoUserRepository (implements)
```

---

## Container/DI Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Container (Singleton)                │
│          (src/shared/bootstrap/Container.ts)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Dependencies Map:                                      │
│  {                                                      │
│    'USER_REPOSITORY': MongoUserRepository,             │
│    'CREATE_USER_USE_CASE': CreateUserUseCase,          │
│    'GET_USER_BY_EMAIL_USE_CASE': GetUserByEmailUseCase,│
│    'VERIFY_USER_EMAIL_USE_CASE': VerifyUserEmailUseCase│
│  }                                                      │
│                                                         │
│  Methods:                                               │
│  ├─ register(key, instance)                            │
│  ├─ registerSingleton(key, factory)                    │
│  ├─ registerFactory(key, factory)                      │
│  ├─ resolve(key) → instance                            │
│  ├─ has(key) → boolean                                 │
│  ├─ clear()                                            │
│  └─ getInstance() → Container (static)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
         ▲                               ▲
         │                               │
         │                               │
    Registered by              Resolved by
    AppBootstrap               API Routes &
    .initialize()              Server Components
         │                               │
         │                               │
    ┌────┴───────────────────────────────┴────┐
    │                                         │
    │  registerRepositories()                  │
    │  registerUseCases()                      │
    │  registerServices()                      │
    │                                         │
    └─────────────────────────────────────────┘
```

---

## Request Lifecycle with DI

```
HTTP Request
    │
    ├─ route.ts handler
    │   │
    │   ├─ Parse & validate input
    │   │
    │   └─ initializeAppAndGetService(ServiceKey)
    │       │
    │       ├─ Check if AppBootstrap.isBootstrapped()
    │       │   │
    │       │   └─ If not: await AppBootstrap.initialize()
    │       │       │
    │       │       ├─ Connect to MongoDB
    │       │       │
    │       │       ├─ registerRepositories()
    │       │       │   └─ Container.registerSingleton(USER_REPOSITORY, ...)
    │       │       │
    │       │       ├─ registerUseCases()
    │       │       │   └─ Container.registerSingleton(CREATE_USER_USE_CASE, ...)
    │       │       │       (resolves from Container automatically)
    │       │       │
    │       │       └─ registerServices()
    │       │
    │       └─ Container.resolve(ServiceKey)
    │           └─ Return use case instance
    │
    ├─ useCase.execute(request)
    │   │
    │   ├─ Orchestrate domain operations
    │   │
    │   ├─ userRepository.(method)
    │   │   └─ MongoDB operation
    │   │
    │   └─ Return Result<success | failure>
    │
    ├─ Handle Result
    │   │
    │   ├─ If success: return data (201, 200)
    │   │
    │   └─ If failure: return error (400, 500)
    │
    └─ HTTP Response → Client
```

---

This visual architecture shows how all layers work together to create a scalable, maintainable enterprise application!

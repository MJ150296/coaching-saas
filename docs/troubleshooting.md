# Troubleshooting & FAQs

## Common Issues & Solutions

### MongoDB Connection Issues

**Issue**: `MongoNetworkError: connect ECONNREFUSED`

**Causes & Solutions**:
1. **Local MongoDB not running**
   ```bash
   # If using local MongoDB
   mongod  # Start MongoDB service
   
   # If using Mac with Homebrew
   brew services start mongodb-community
   
   # If using Docker
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

2. **Wrong connection string**
   ```bash
   # Verify in .env.local
   # For local: mongodb://localhost:27017/school-saas
   # For Atlas: mongodb+srv://user:password@cluster.mongodb.net/school-saas
   # (without angle brackets or default values)
   ```

3. **Network timeout with MongoDB Atlas**
   - Check firewall: Is your IP whitelisted in MongoDB Atlas?
   - Navigate to: Database Access → Network Access
   - Add your IP address: 0.0.0.0/0 (for development only, restrict in production)

4. **Mongoose duplicate model**
   ```
   Error: Cannot overwrite `User` model once compiled
   ```
- This is handled in the codebase via a cached singleton connection in [src/shared/infrastructure/database.ts](../src/shared/infrastructure/database.ts)
   - Ensure you're not importing schemas multiple times
   - Clear `node_modules` and reinstall if persists: `rm -rf node_modules && npm install`

---

### NextAuth Issues

**Issue**: `NEXTAUTH_SECRET not set`

**Solution**:
```bash
# Generate secret
openssl rand -hex 32

# Add to .env.local
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000
```

**Issue**: `Provider is not configured`

**Solution**:
- Check [src/shared/infrastructure/auth.ts](../src/shared/infrastructure/auth.ts)
- Ensure `providers: [CredentialsProvider({...})]` is configured
- Verify `authorize()` function calls the database correctly

**Issue**: Session not persisting between requests

**Solution**:
1. Verify [src/app/providers.tsx](../src/app/providers.tsx) wraps your application with `<SessionProvider>`
2. Check [src/app/layout.tsx](../src/app/layout.tsx) uses `<Providers>` component
3. Clear browser cookies and cache
4. Restart dev server: `npm run dev`

---

### TypeScript Compilation Errors

**Issue**: `TS2305: Module 'xyz' has no exported member`

**Solution**:
```typescript
// Wrong (if xyz is interface)
export { UserRepository } from './UserRepository';

// Correct
export type { UserRepository } from './UserRepository';
```

This is required for `isolatedModules: true` in [tsconfig.json](../tsconfig.json).

**Issue**: `TS1205: Re-exporting a type when the '--isolatedModules' flag is set`

**Solution**: Use `export type` for all interface/type exports as shown above.

**Issue**: `Property 'user' does not exist on type 'Session'`

**Solution**:
Check [src/types/next-auth.d.ts](../src/types/next-auth.d.ts) properly extends NextAuth types:
```typescript
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession['user'];
  }
}
```

---

### Application Bootstrap Issues

**Issue**: `ServiceKey 'X_USE_CASE' not registered`

**Solution**:
1. Check [src/shared/bootstrap/AppBootstrap.ts](../src/shared/bootstrap/AppBootstrap.ts)
2. Verify your service is registered in `registerUseCases()` or `registerRepositories()`
3. Use correct `ServiceKeys` enum value

**Issue**: `Initialize AppBootstrap first` error

**Solution**:
This shouldn't happen if you're using `initializeAppAndGetService()` from [src/shared/bootstrap/init.ts](../src/shared/bootstrap/init.ts). This function:
- Checks if already initialized (idempotent)
- Initializes if needed
- Returns service instance

---

### Password Encryption Issues

**Issue**: Password comparison always returns false

**Solution**:
1. Ensure password is hashed before saving: [src/app/api/auth/register/route.ts](../src/app/api/auth/register/route.ts) line ~20
2. Check `PasswordEncryption.hash()` is called
3. When signing in, ensure stored password is compared correctly in [src/shared/infrastructure/auth.ts](../src/shared/infrastructure/auth.ts)

**Issue**: `bcryptjs` module not found

**Solution**:
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

---

### Port & Development Server Issues

**Issue**: `Port 3000 already in use`

**Solution**:
```bash
# Use different port
npm run dev -- -p 3001

# Or kill existing process
lsof -i :3000
kill -9 <PID>

# Or use with PORT env variable
PORT=3001 npm run dev
```

**Issue**: Page shows `getStaticProps is not supported` on `/auth/signin`

**Solution**:
- This is expected - authentication pages should be dynamic (not static)
- Ensure pages in [src/app/auth/](../src/app/auth/) are client components with `'use client'`

**Issue**: `Could not find module` for imports

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

---

### Database Schema Issues

**Issue**: `Duplicate index warning for email field`

**Solution**:
Already fixed in [src/domains/user-management/infrastructure/persistence/UserSchema.ts](../src/domains/user-management/infrastructure/persistence/UserSchema.ts). The schema uses:
```typescript
email: { type: String, required: true, unique: true, lowercase: true, trim: true }
// NOT: userSchema.index({ email: 1 }) // This creates duplicate!
```

**Issue**: Can't indexes in MongoDB with duplicate keyNames

**Solution**:
Use `unique: true` instead of explicit index for unique fields. MongoDB automatically creates index.

---

### API Route Issues

**Issue**: `405 Method Not Allowed`

**Solution**:
- Ensure your route file exports the correct method (GET, POST, PUT, DELETE)
- Example: POST request to GET-only endpoint

**Issue**: CORS errors when calling API from frontend

**Solution**:
- API routes are same-origin (no CORS needed for next.js frontend)
- If calling external API, add CORS headers in route handler:
```typescript
export async function GET(request: NextRequest) {
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

**Issue**: Request body is empty

**Solution**:
```typescript
const body = await request.json(); // Must await
```

---

## Frequently Asked Questions (FAQs)

### Q: How do I add a new domain (like Student Management)?

**A**: Follow this pattern:

1. Create directory structure:
```bash
mkdir -p src/domains/<domain-name>/{domain/{entities,value-objects,domain-events,repositories},application/{dtos,mappers,use-cases},infrastructure/{persistence,external-services}}
```

2. Create Student entity following [src/domains/user-management/domain/entities/User.ts](../src/domains/user-management/domain/entities/User.ts)

3. Create StudentRepository interface

4. Create MongoStudentRepository implementation

5. Register in [src/shared/bootstrap/AppBootstrap.ts](../src/shared/bootstrap/AppBootstrap.ts):
```typescript
registerRepositories(): void {
  const userRepository = new MongoUserRepository();
  this.container.registerSingleton(ServiceKeys.USER_REPOSITORY, userRepository);
  
  // Add this:
  const studentRepository = new MongoStudentRepository();
  this.container.registerSingleton(ServiceKeys.STUDENT_REPOSITORY, studentRepository);
}
```

6. Create use cases and register them similarly

---

### Q: How do I add a new API route?

**A**: Example for creating a student:

```typescript
// src/app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { ServiceKeys } from '@/shared/bootstrap';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/shared/infrastructure/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const createStudentUseCase = initializeAppAndGetService(ServiceKeys.CREATE_STUDENT_USE_CASE);
    
    const result = await createStudentUseCase.execute(body);
    
    if (result.isSuccess) {
      return NextResponse.json(result.getValue(), { status: 201 });
    } else {
      return NextResponse.json(
        { message: result.getError() },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Q: How do I protect routes by role?

**A**: Add role check middleware in route:

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Allow only ADMIN and above
  const allowedRoles = ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'COACHING_ADMIN', 'ADMIN'];
  if (!allowedRoles.includes(session.user?.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  // Continue with logic
}
```

---

### Q: How do I modify an entity?

**A**: Create a method on the entity that triggers domain events:

```typescript
// In User.ts
changeRole(newRole: UserRole): void {
  Guard.againstNullOrUndefined(newRole, 'newRole');
  this.props.role = newRole;
  this.addDomainEvent(
    new UserRoleChangedEvent(
      this.id,
      newRole,
      new Date()
    )
  );
}
```

Then use a use case to call it:

```typescript
// In ChangeUserRoleUseCase.ts
async execute(request: ChangeUserRoleRequest): Result<void> {
  const user = await this.userRepository.findById(request.userId);
  if (!user) {
    return Result.fail('User not found');
  }

  user.changeRole(request.newRole);
  await this.userRepository.save(user);
  
  return Result.ok();
}
```

---

### Q: Why use DDD instead of a simpler approach?

**A**: DDD provides:
1. **Scalability**: Clear separation in multiple domains as app grows
2. **Testability**: Pure business logic in domain layer, easy to test
3. **Maintainability**: Clear patterns to follow
4. **Flexibility**: Easy to add business rules without affecting other domains
5. **Team clarity**: Architecture is explicit and documented

For this school management system with multiple domains (User, Student, Class, Assessment, etc.), DDD prevents spaghetti code.

---

### Q: How do I add authentication to a page?

**A**: Use `useSession` hook on client components:

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div>
      <h1>Welcome {session.user?.name}</h1>
      <p>Role: {session.user?.role}</p>
    </div>
  );
}
```

---

### Q: How do I add a new field to User?

**A**: 
1. Update User entity in [src/domains/user-management/domain/entities/User.ts](../src/domains/user-management/domain/entities/User.ts)
2. Add value object if needed in [src/domains/user-management/domain/value-objects/index.ts](../src/domains/user-management/domain/value-objects/index.ts)
3. Update UserSchema in [src/domains/user-management/infrastructure/persistence/UserSchema.ts](../src/domains/user-management/infrastructure/persistence/UserSchema.ts)
4. Update UserMapper in [src/domains/user-management/application/mappers/UserMapper.ts](../src/domains/user-management/application/mappers/UserMapper.ts)
5. Update DTOs in [src/domains/user-management/application/dtos/index.ts](../src/domains/user-management/application/dtos/index.ts)

---

### Q: How do I query users by a criteria?

**A**: Add method to UserRepository interface and implement:

```typescript
// In UserRepository interface
findByRole(role: UserRole): Promise<User[]>;
findAllActive(): Promise<User[]>;

// In MongoUserRepository
async findByRole(role: UserRole): Promise<User[]> {
  await ensureConnection();
  const documents = await UserModel.find({ role });
  return documents.map(doc => this.toDomainEntity(doc));
}
```

Then use in a use case:

```typescript
export class GetUsersByRoleUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: GetUsersByRoleRequest): Promise<Result<UserResponseDTO[]>> {
    const users = await this.userRepository.findByRole(request.role);
    return Result.ok(users.map(UserMapper.toDTO));
  }
}
```

---

### Q: How do I handle validation errors?

**A**: Return error through Result:

```typescript
const emailValidation = Email.create(request.email);
if (emailValidation.isFail) {
  return Result.fail('Invalid email format');
}

const passwordValidation = Password.create(request.password);
if (passwordValidation.isFail) {
  return Result.fail('Password too short');
}
```

Value objects handle validation in their `create()` method.

---

### Q: Can I use this with a different database (PostgreSQL, MySQL)?

**A**: Yes! DDD architecture makes this easy:

1. Keep all domain logic unchanged
2. Create new repository implementations:
   ```typescript
   // src/domains/user-management/infrastructure/persistence/PostgresUserRepository.ts
   export class PostgresUserRepository implements UserRepository {
     // Same interface, different implementation
   }
   ```
3. Change registration in [src/shared/bootstrap/AppBootstrap.ts](../src/shared/bootstrap/AppBootstrap.ts)
4. No business logic changes needed!

---

### Q: How do I get detailed TypeScript errors?

**A**:
```bash
# Run type checker
npx tsc --noEmit

# With verbose output
npx tsc --noEmit --pretty

# Check specific file
npx tsc --noEmit src/app/api/auth/register/route.ts
```

---

### Q: How do I debug API routes?

**A**: Add console logs and use Node debugger:

```typescript
// In your route
console.log('Request body:', body);
console.log('UseCase:', createUserUseCase);

// Run with debugger
node --inspect-brk node_modules/.bin/next dev
# Then open chrome://inspect
```

Or use VS Code debugger with `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "protocol": "inspector"
    }
  ]
}
```

---

### Q: Is there production-ready?

**A**: Almost! Before production:

1. **Security**:
   - Use strong NEXTAUTH_SECRET (openssl rand -hex 32)
   - Set secure cookies: `secure: true` in NextAuth production
   - Implement rate limiting on auth endpoints
   - Add CSRF protection

2. **Performance**:
   - Add database indexing strategy (indexes on frequently queried fields)
   - Enable connection pooling for MongoDB Atlas
   - Cache frequent queries

3. **Monitoring**:
   - Add error tracking (Sentry, LogRocket)
   - Monitor database performance
   - Track API response times

4. **Testing**:
   - Add unit tests for use cases
   - Add integration tests for repositories
   - Add e2e tests for user flows

5. **Documentation**:
   - Document API endpoints (OpenAPI/Swagger)
   - Document deployment process
   - Document emergency procedures

---

### Q: What's the best way to extend this?

**A**: Follow these patterns:

1. **New domain** → Copy user-management structure
2. **New service** → Implement interface, register in Bootstrap
3. **New API route** → Follow existing patterns
4. **New UI page** → Use existing page/component patterns
5. **Database change** → Update schema → Update entity → Update mapper

Always maintain the 3-layer architecture (Domain/Application/Infrastructure).

---

## Performance Tips

```typescript
// ❌ Bad: Multiple database calls in loop
for (const userId of userIds) {
  const user = await repository.findById(userId); // N calls!
}

// ✅ Good: Single batch query
const users = await repository.findByIds(userIds);
```

```typescript
// ❌ Bad: No indexes on frequently queried fields
async execute(request): Promise<Result> {
  const user = await repository.findByEmail(email); // Slow scan!
}

// ✅ Good: Index on email field
// In UserSchema.ts: email: { unique: true }
```

```typescript
// ❌ Bad: Creating instances repeatedly
export async function POST(request) {
  const repo = new MongoUserRepository(); // New instance each request
  const useCase = new CreateUserUseCase(repo);
}

// ✅ Good: Reuse singleton instances through DI
const useCase = initializeAppAndGetService(ServiceKeys.CREATE_USER_USE_CASE);
```

---

## Next Steps

1. ✅ Understand basic architecture - read [architecture.md](architecture.md)
2. ✅ Try creating a Student domain following User pattern
3. ✅ Add API routes for student operations
4. ✅ Create student registration and management UI
5. ✅ Add email notifications service
6. ✅ Add authorization/permissions beyond roles
7. ✅ Set up testing infrastructure
8. ✅ Deploy to production

Good luck! 🚀

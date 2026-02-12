# Setup Checklist

Use this checklist to confirm the project is ready to run.

## 1. Environment

```bash
cp .env.example .env.local
```

Set values in `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/school-saas
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

Generate secret:

```bash
npx auth secret
```

## 2. Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

## 3. Smoke Tests

```bash
# Check superadmin status
curl http://localhost:3000/api/auth/superadmin-check

# Seed a test user (optional)
curl -X POST http://localhost:3000/api/dev/seed-test-user
```

See `README.md` for the full overview.

import { NextRequest, NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateUserUseCase } from '@/domains/user-management/application/use-cases';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const expectedKey = process.env.DEV_SEED_KEY;
  if (!expectedKey) {
    return NextResponse.json({ error: 'DEV_SEED_KEY is not configured' }, { status: 503 });
  }

  const providedKey = request.headers.get('x-dev-seed-key');
  if (providedKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const useCase = await initializeAppAndGetService<CreateUserUseCase>(ServiceKeys.CREATE_USER_USE_CASE);

  const result = await useCase.execute({
    email: 'student@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Student',
    role: UserRole.STUDENT,
    organizationId: 'demo-org',
    coachingCenterId: 'demo-coaching-center',
  });

  if (result.getIsFailure() && !String(result.getError()).includes('already exists')) {
    return NextResponse.json({ error: result.getError() }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

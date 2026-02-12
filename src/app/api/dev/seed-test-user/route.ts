import { NextResponse } from 'next/server';
import { ServiceKeys } from '@/shared/bootstrap';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { CreateUserUseCase } from '@/domains/user-management/application/use-cases';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export async function POST() {
  const useCase = await initializeAppAndGetService<CreateUserUseCase>(ServiceKeys.CREATE_USER_USE_CASE);

  const result = await useCase.execute({
    email: 'student@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Student',
    role: UserRole.STUDENT,
    organizationId: 'demo-org',
    schoolId: 'demo-school',
  });

  if (result.getIsFailure() && !String(result.getError()).includes('already exists')) {
    return NextResponse.json({ error: result.getError() }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/domains/user-management/domain/entities/User';
import { MongoUserRepository } from '@/domains/user-management/infrastructure/persistence/MongoUserRepository';
import { CreateUserUseCase } from '@/domains/user-management/application/use-cases';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { ServiceKeys } from '@/shared/bootstrap';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.firstName || !body.lastName || !body.email || !body.password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const repo = await initializeAppAndGetService<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
    const existing = await repo.findByRole(UserRole.SUPER_ADMIN);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Superadmin already exists' }, { status: 409 });
    }

    const useCase = await initializeAppAndGetService<CreateUserUseCase>(ServiceKeys.CREATE_USER_USE_CASE);
    const result = await useCase.execute({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      role: UserRole.SUPER_ADMIN,
    });

    if (result.getIsFailure()) {
      return NextResponse.json({ error: result.getError() }, { status: 400 });
    }

    await logAuditEvent({
      actorId: result.getValue().user.id,
      actorRole: UserRole.SUPER_ADMIN,
      action: 'BOOTSTRAP_SUPERADMIN',
      targetId: result.getValue().user.id,
      targetRole: UserRole.SUPER_ADMIN,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json(result.getValue(), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bootstrap failed' },
      { status: 500 }
    );
  }
}

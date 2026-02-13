/**
 * Check if a superadmin user exists
 * GET /api/auth/superadmin-check
 */

import { NextResponse } from 'next/server';
import { initializeAppAndGetService } from '@/shared/bootstrap/init';
import { ServiceKeys } from '@/shared/bootstrap';
import { MongoUserRepository } from '@/domains/user-management/infrastructure/persistence/MongoUserRepository';
import { UserRole } from '@/domains/user-management/domain/entities/User';

export async function GET() {
  try {
    const userRepository = await initializeAppAndGetService<MongoUserRepository>(
      ServiceKeys.USER_REPOSITORY
    );

    // Try to find any superadmin user
    const superadmins = await userRepository.findByRole(UserRole.SUPER_ADMIN);

    return NextResponse.json(
      {
        superadminExists: superadmins.length > 0,
        requiresBootstrap: superadmins.length === 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Superadmin check error:', error);
    return NextResponse.json(
      { error: 'Failed to check superadmin status' },
      { status: 500 }
    );
  }
}

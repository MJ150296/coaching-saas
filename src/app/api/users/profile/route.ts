import { NextRequest, NextResponse } from 'next/server';
import { getActorUser } from '@/shared/infrastructure/actor';
import { UserModel } from '@/domains/user-management/infrastructure/persistence/UserSchema';
import { PasswordEncryption } from '@/domains/user-management/infrastructure/external-services/PasswordEncryption';
import { connectDB } from '@/shared/infrastructure/database';
import { logAuditEvent } from '@/shared/infrastructure/audit-log';

export async function GET() {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findById(actor.getId())
      .select('_id email firstName lastName phone role organizationId coachingCenterId isActive emailVerified createdAt updatedAt')
      .lean<{
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: string;
        organizationId?: string;
        coachingCenterId?: string;
        isActive: boolean;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
      } | null>();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      organizationId: user.organizationId,
      coachingCenterId: user.coachingCenterId,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await getActorUser();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '';
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
    const phoneRaw = typeof body.phone === 'string' ? body.phone.trim() : '';
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'firstName and lastName are required' }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findById(actor.getId());
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let passwordUpdated = false;
    if (newPassword.length > 0) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'currentPassword is required to change password' }, { status: 400 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'newPassword must be at least 8 characters' }, { status: 400 });
      }

      const passwordMatches = await PasswordEncryption.compare(currentPassword, user.password);
      if (!passwordMatches) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      user.password = await PasswordEncryption.hash(newPassword);
      passwordUpdated = true;
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phoneRaw || undefined;
    user.updatedAt = new Date();
    await user.save();

    await logAuditEvent({
      actorId: actor.getId(),
      actorRole: actor.getRole(),
      action: passwordUpdated ? 'UPDATE_PROFILE_AND_PASSWORD' : 'UPDATE_PROFILE',
      targetId: actor.getId(),
      targetRole: actor.getRole(),
      organizationId: actor.getOrganizationId(),
      coachingCenterId: actor.getCoachingCenterId(),
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        role: user.role,
        organizationId: user.organizationId,
        coachingCenterId: user.coachingCenterId,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      passwordUpdated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

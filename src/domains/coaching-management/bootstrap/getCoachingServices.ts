import {
  CreateCoachingBatchUseCase,
  CreateCoachingProgramUseCase,
  CreateCoachingSessionUseCase,
  MarkCoachingAttendanceUseCase,
} from '../application/use-cases';
import {
  MongoCoachingAttendanceRepository,
  MongoCoachingBatchRepository,
  MongoCoachingEnrollmentRepository,
  MongoCoachingProgramRepository,
  MongoCoachingSessionRepository,
} from '../infrastructure/persistence/MongoCoachingRepository';
import { registerCoachingServices } from './registerCoachingServices';
import { connectDB } from '@/shared/infrastructure/database';
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export async function getCoachingServices(): Promise<{
  coachingProgramRepository: MongoCoachingProgramRepository;
  coachingBatchRepository: MongoCoachingBatchRepository;
  coachingSessionRepository: MongoCoachingSessionRepository;
  coachingAttendanceRepository: MongoCoachingAttendanceRepository;
  coachingEnrollmentRepository: MongoCoachingEnrollmentRepository;
  createCoachingProgramUseCase: CreateCoachingProgramUseCase;
  createCoachingBatchUseCase: CreateCoachingBatchUseCase;
  createCoachingSessionUseCase: CreateCoachingSessionUseCase;
  markCoachingAttendanceUseCase: MarkCoachingAttendanceUseCase;
}> {
  await connectDB();
  registerCoachingServices();

  return {
    coachingProgramRepository: Container.resolve<MongoCoachingProgramRepository>(ServiceKeys.COACHING_PROGRAM_REPOSITORY),
    coachingBatchRepository: Container.resolve<MongoCoachingBatchRepository>(ServiceKeys.COACHING_BATCH_REPOSITORY),
    coachingSessionRepository: Container.resolve<MongoCoachingSessionRepository>(ServiceKeys.COACHING_SESSION_REPOSITORY),
    coachingAttendanceRepository: Container.resolve<MongoCoachingAttendanceRepository>(
      ServiceKeys.COACHING_ATTENDANCE_REPOSITORY
    ),
    coachingEnrollmentRepository: Container.resolve<MongoCoachingEnrollmentRepository>(
      ServiceKeys.COACHING_ENROLLMENT_REPOSITORY
    ),
    createCoachingProgramUseCase: Container.resolve<CreateCoachingProgramUseCase>(
      ServiceKeys.CREATE_COACHING_PROGRAM_USE_CASE
    ),
    createCoachingBatchUseCase: Container.resolve<CreateCoachingBatchUseCase>(
      ServiceKeys.CREATE_COACHING_BATCH_USE_CASE
    ),
    createCoachingSessionUseCase: Container.resolve<CreateCoachingSessionUseCase>(
      ServiceKeys.CREATE_COACHING_SESSION_USE_CASE
    ),
    markCoachingAttendanceUseCase: Container.resolve<MarkCoachingAttendanceUseCase>(
      ServiceKeys.MARK_COACHING_ATTENDANCE_USE_CASE
    ),
  };
}

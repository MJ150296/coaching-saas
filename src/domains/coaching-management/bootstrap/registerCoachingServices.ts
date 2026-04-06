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
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export function registerCoachingServices(): void {
  if (!Container.has(ServiceKeys.COACHING_PROGRAM_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.COACHING_PROGRAM_REPOSITORY, () => new MongoCoachingProgramRepository());
  }

  if (!Container.has(ServiceKeys.COACHING_BATCH_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.COACHING_BATCH_REPOSITORY, () => new MongoCoachingBatchRepository());
  }

  if (!Container.has(ServiceKeys.COACHING_SESSION_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.COACHING_SESSION_REPOSITORY, () => new MongoCoachingSessionRepository());
  }

  if (!Container.has(ServiceKeys.COACHING_ATTENDANCE_REPOSITORY)) {
    Container.registerSingleton(
      ServiceKeys.COACHING_ATTENDANCE_REPOSITORY,
      () => new MongoCoachingAttendanceRepository()
    );
  }

  if (!Container.has(ServiceKeys.COACHING_ENROLLMENT_REPOSITORY)) {
    Container.registerSingleton(
      ServiceKeys.COACHING_ENROLLMENT_REPOSITORY,
      () => new MongoCoachingEnrollmentRepository()
    );
  }

  if (!Container.has(ServiceKeys.CREATE_COACHING_PROGRAM_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_COACHING_PROGRAM_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingProgramRepository>(ServiceKeys.COACHING_PROGRAM_REPOSITORY);
      return new CreateCoachingProgramUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.CREATE_COACHING_BATCH_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_COACHING_BATCH_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingBatchRepository>(ServiceKeys.COACHING_BATCH_REPOSITORY);
      return new CreateCoachingBatchUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.CREATE_COACHING_SESSION_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_COACHING_SESSION_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingSessionRepository>(ServiceKeys.COACHING_SESSION_REPOSITORY);
      return new CreateCoachingSessionUseCase(repo);
    });
  }

  if (!Container.has(ServiceKeys.MARK_COACHING_ATTENDANCE_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.MARK_COACHING_ATTENDANCE_USE_CASE, () => {
      const repo = Container.resolve<MongoCoachingAttendanceRepository>(ServiceKeys.COACHING_ATTENDANCE_REPOSITORY);
      return new MarkCoachingAttendanceUseCase(repo);
    });
  }
}

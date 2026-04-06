import { CreateAcademicYearUseCase } from '../application/use-cases';
import { MongoAcademicYearRepository } from '../infrastructure/persistence/MongoAcademicRepository';
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export function registerAcademicServices(): void {
  if (!Container.has(ServiceKeys.ACADEMIC_YEAR_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.ACADEMIC_YEAR_REPOSITORY, () => new MongoAcademicYearRepository());
  }

  if (!Container.has(ServiceKeys.CREATE_ACADEMIC_YEAR_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_ACADEMIC_YEAR_USE_CASE, () => {
      const repo = Container.resolve<MongoAcademicYearRepository>(ServiceKeys.ACADEMIC_YEAR_REPOSITORY);
      return new CreateAcademicYearUseCase(repo);
    });
  }
}

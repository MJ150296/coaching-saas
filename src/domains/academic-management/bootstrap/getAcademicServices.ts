import { CreateAcademicYearUseCase } from '../application/use-cases';
import { MongoAcademicYearRepository } from '../infrastructure/persistence/MongoAcademicRepository';
import { registerAcademicServices } from './registerAcademicServices';
import { connectDB } from '@/shared/infrastructure/database';
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export async function getAcademicServices(): Promise<{
  academicYearRepository: MongoAcademicYearRepository;
  createAcademicYearUseCase: CreateAcademicYearUseCase;
}> {
  await connectDB();
  registerAcademicServices();

  return {
    academicYearRepository: Container.resolve<MongoAcademicYearRepository>(ServiceKeys.ACADEMIC_YEAR_REPOSITORY),
    createAcademicYearUseCase: Container.resolve<CreateAcademicYearUseCase>(ServiceKeys.CREATE_ACADEMIC_YEAR_USE_CASE),
  };
}

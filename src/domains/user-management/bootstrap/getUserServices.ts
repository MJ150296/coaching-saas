import {
  CreateUserUseCase,
  GetUserByEmailUseCase,
  VerifyUserEmailUseCase,
} from '../application/use-cases';
import { MongoUserRepository } from '../infrastructure/persistence/MongoUserRepository';
import { registerUserServices } from './registerUserServices';
import { connectDB } from '@/shared/infrastructure/database';
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export async function getUserServices(): Promise<{
  userRepository: MongoUserRepository;
  createUserUseCase: CreateUserUseCase;
  getUserByEmailUseCase: GetUserByEmailUseCase;
  verifyUserEmailUseCase: VerifyUserEmailUseCase;
}> {
  await connectDB();
  registerUserServices();

  return {
    userRepository: Container.resolve<MongoUserRepository>(ServiceKeys.USER_REPOSITORY),
    createUserUseCase: Container.resolve<CreateUserUseCase>(ServiceKeys.CREATE_USER_USE_CASE),
    getUserByEmailUseCase: Container.resolve<GetUserByEmailUseCase>(ServiceKeys.GET_USER_BY_EMAIL_USE_CASE),
    verifyUserEmailUseCase: Container.resolve<VerifyUserEmailUseCase>(ServiceKeys.VERIFY_USER_EMAIL_USE_CASE),
  };
}

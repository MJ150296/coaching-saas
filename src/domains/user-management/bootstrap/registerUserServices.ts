import {
  CreateUserUseCase,
  GetUserByEmailUseCase,
  VerifyUserEmailUseCase,
} from '../application/use-cases';
import { MongoUserRepository } from '../infrastructure/persistence/MongoUserRepository';
import { Container } from '@/shared/bootstrap/Container';
import { ServiceKeys } from '@/shared/bootstrap/ServiceKeys';

export function registerUserServices(): void {
  if (!Container.has(ServiceKeys.USER_REPOSITORY)) {
    Container.registerSingleton(ServiceKeys.USER_REPOSITORY, () => new MongoUserRepository());
  }

  if (!Container.has(ServiceKeys.CREATE_USER_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.CREATE_USER_USE_CASE, () => {
      const userRepository = Container.resolve<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
      return new CreateUserUseCase(userRepository);
    });
  }

  if (!Container.has(ServiceKeys.GET_USER_BY_EMAIL_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.GET_USER_BY_EMAIL_USE_CASE, () => {
      const userRepository = Container.resolve<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
      return new GetUserByEmailUseCase(userRepository);
    });
  }

  if (!Container.has(ServiceKeys.VERIFY_USER_EMAIL_USE_CASE)) {
    Container.registerSingleton(ServiceKeys.VERIFY_USER_EMAIL_USE_CASE, () => {
      const userRepository = Container.resolve<MongoUserRepository>(ServiceKeys.USER_REPOSITORY);
      return new VerifyUserEmailUseCase(userRepository);
    });
  }
}

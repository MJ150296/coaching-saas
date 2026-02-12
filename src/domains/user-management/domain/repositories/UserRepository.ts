import type { Repository } from '@/shared/domain';
import { User, UserRole } from '../entities/User';

export interface UserRepository extends Repository<User, string> {
  findByEmail(email: string): Promise<User | null>;
  emailExists(email: string): Promise<boolean>;
  findByRole(role: UserRole | string): Promise<User[]>;
  findAllActive(): Promise<User[]>;
}

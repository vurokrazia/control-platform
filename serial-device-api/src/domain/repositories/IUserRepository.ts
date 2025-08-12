import { User } from '../entities/User';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, userData: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  updateLastLogin(id: string): Promise<void>;
  activateUser(id: string): Promise<boolean>;
  deactivateUser(id: string): Promise<boolean>;
  verifyEmail(id: string): Promise<boolean>;
  findActiveUsers(): Promise<User[]>;
  countUsers(): Promise<number>;
}
import { User } from '../entities/User';

export interface UserRepository {
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

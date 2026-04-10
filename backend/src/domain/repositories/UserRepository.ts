import { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<void>;
}

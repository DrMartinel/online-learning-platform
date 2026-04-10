import { SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/UserRepository';

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return new User(
      data.id,
      data.full_name,
      data.role as UserRole,
      new Date(data.created_at)
    );
  }

  async update(user: User): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({
        full_name: user.fullName,
      })
      .eq('id', user.id);

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }
}

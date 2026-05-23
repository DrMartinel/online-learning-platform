import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../entities/User';
import { UserRepository } from './Iuser.repository';

export class SupabaseUserRepository implements UserRepository {
  constructor(private client: SupabaseClient) {}

  private mapToUser(row: any): User {
    return new User(
      row.id,
      row.email,
      row.full_name,
      row.role,
      row.bio,
      row.avatar_url,
      new Date(row.created_at)
    );
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'isInstructor' | 'isAdmin' | 'updateFullName'>): Promise<User> {
    const { data, error } = await this.client
      .from('profiles')
      .insert({
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        bio: user.bio,
        avatar_url: user.avatarUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToUser(data);
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToUser(data);
  }

  async save(user: User): Promise<User> {
    const { data, error } = await this.client
      .from('profiles')
      .update({
        full_name: user.fullName,
        bio: user.bio,
        avatar_url: user.avatarUrl,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToUser(data);
  }
}

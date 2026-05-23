import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../entities/User';
import { UserRepository } from './Iuser.repository';

export class SupabaseUserRepository implements UserRepository {
  constructor(private client: SupabaseClient) {}

  private async resolveRole(userId: string): Promise<string> {
    const { data } = await this.client
      .from('iam_user_roles')
      .select('role:iam_roles!inner(urn)')
      .eq('user_id', userId)
      .limit(1);

    if (data && data.length > 0) {
      const urn = (data[0] as any).role?.urn;
      if (urn) return urn.replace('role:user:', '');
    }
    return 'student';
  }

  private mapToUser(row: any, role: string): User {
    return new User(
      row.id,
      row.email,
      row.full_name,
      role as any,
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
        bio: user.bio,
        avatar_url: user.avatarUrl,
      })
      .select()
      .single();

    if (error) throw error;
    const role = await this.resolveRole(data.id);
    return this.mapToUser(data, role);
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const role = await this.resolveRole(id);
    return this.mapToUser(data, role);
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select();

    if (error) throw error;

    // Resolve roles for all users
    const users: User[] = [];
    for (const row of data || []) {
      const role = await this.resolveRole(row.id);
      users.push(this.mapToUser(row, role));
    }
    return users;
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
    const role = await this.resolveRole(user.id);
    return this.mapToUser(data, role);
  }
}

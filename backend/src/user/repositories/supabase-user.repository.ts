import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../entities/User';
import { UserRepository } from './Iuser.repository';

export class SupabaseUserRepository implements UserRepository {
  constructor(private client: SupabaseClient) {}

  private async resolveRoleAndPermissions(userId: string): Promise<{ role: string, permissions: string[] }> {
    const { data } = await this.client
      .from('iam_user_roles')
      .select('role:iam_roles!inner(urn, iam_role_permissions(permission:iam_permissions!inner(urn)))')
      .eq('user_id', userId);

    if (data && data.length > 0) {
      const roles = data.map((d: any) => d.role);
      
      // Determine the highest priority role
      let finalRole = 'student';
      const roleUrns = roles.map(r => r?.urn || '');
      
      if (roleUrns.includes('role:user:admin')) {
        finalRole = 'admin';
      } else if (roleUrns.includes('role:user:operator')) {
        finalRole = 'operator';
      } else if (roleUrns.length > 0 && roleUrns[0]) {
        finalRole = roleUrns[0].replace('role:user:', '');
      }

      // Collect all unique permissions from all roles
      const allPermissionsSet = new Set<string>();
      roles.forEach((roleObj: any) => {
        const perms = roleObj?.iam_role_permissions?.map((p: any) => p.permission?.urn) || [];
        perms.forEach((p: string) => {
          if (p) allPermissionsSet.add(p);
        });
      });

      return { role: finalRole, permissions: Array.from(allPermissionsSet) };
    }
    return { role: 'student', permissions: [] };
  }

  private mapToUser(row: any, role: string, permissions: string[] = []): User {
    const user = new User(
      row.id,
      row.email,
      row.full_name,
      role as any,
      row.bio,
      row.avatar_url,
      new Date(row.created_at)
    );
    user.permissions = permissions;
    return user;
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
    const { role, permissions } = await this.resolveRoleAndPermissions(data.id);
    return this.mapToUser(data, role, permissions);
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    const { role, permissions } = await this.resolveRoleAndPermissions(id);
    return this.mapToUser(data, role, permissions);
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.client
      .from('profiles')
      .select();

    if (error) throw error;

    // Resolve roles and permissions for all users
    const users: User[] = [];
    for (const row of data || []) {
      const { role, permissions } = await this.resolveRoleAndPermissions(row.id);
      users.push(this.mapToUser(row, role, permissions));
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
    const { role, permissions } = await this.resolveRoleAndPermissions(user.id);
    return this.mapToUser(data, role, permissions);
  }
}

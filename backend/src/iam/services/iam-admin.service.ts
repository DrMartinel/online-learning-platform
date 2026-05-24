import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  CreateRoleDTO, 
  UpdateRoleDTO, 
  CreatePermissionDTO, 
  UpdatePermissionDTO, 
  RoleResponseDTO, 
  PermissionResponseDTO 
} from '../dto/iam.dto';

@Injectable()
export class IamAdminService {
  constructor(private readonly supabase: SupabaseClient) {}

  // --- Roles ---

  async listRoles(): Promise<RoleResponseDTO[]> {
    const { data, error } = await this.supabase
      .from('iam_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data.map(this.mapToRole);
  }

  async createRole(dto: CreateRoleDTO): Promise<RoleResponseDTO> {
    const { data, error } = await this.supabase
      .from('iam_roles')
      .insert({
        urn: dto.urn,
        description: dto.description,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return this.mapToRole(data);
  }

  async updateRole(id: string, dto: UpdateRoleDTO): Promise<RoleResponseDTO> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (dto.urn) updateData.urn = dto.urn;
    if (dto.description !== undefined) updateData.description = dto.description;

    const { data, error } = await this.supabase
      .from('iam_roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Role not found');
    return this.mapToRole(data);
  }

  async deleteRole(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('iam_roles')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
  }

  // --- Permissions ---

  async listPermissions(): Promise<PermissionResponseDTO[]> {
    const { data, error } = await this.supabase
      .from('iam_permissions')
      .select('*')
      .order('urn', { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data.map(this.mapToPermission);
  }

  async createPermission(dto: CreatePermissionDTO): Promise<PermissionResponseDTO> {
    const { data, error } = await this.supabase
      .from('iam_permissions')
      .insert({
        urn: dto.urn,
        description: dto.description,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return this.mapToPermission(data);
  }

  async updatePermission(id: string, dto: UpdatePermissionDTO): Promise<PermissionResponseDTO> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (dto.urn) updateData.urn = dto.urn;
    if (dto.description !== undefined) updateData.description = dto.description;

    const { data, error } = await this.supabase
      .from('iam_permissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Permission not found');
    return this.mapToPermission(data);
  }

  async deletePermission(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('iam_permissions')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);
  }

  // --- Role Permissions ---

  async getRolePermissions(roleId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('iam_role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    if (error) throw new BadRequestException(error.message);
    return data.map(row => row.permission_id);
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    // Basic verification that the role exists
    const { count } = await this.supabase
      .from('iam_roles')
      .select('*', { count: 'exact', head: true })
      .eq('id', roleId);
      
    if (count === 0) throw new NotFoundException('Role not found');

    // Remove all existing permissions for this role
    const { error: deleteError } = await this.supabase
      .from('iam_role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) throw new BadRequestException(`Failed to clear permissions: ${deleteError.message}`);

    // Insert new ones if provided
    if (permissionIds.length > 0) {
      const inserts = permissionIds.map(permId => ({
        role_id: roleId,
        permission_id: permId
      }));

      const { error: insertError } = await this.supabase
        .from('iam_role_permissions')
        .insert(inserts);

      if (insertError) throw new BadRequestException(`Failed to assign permissions: ${insertError.message}`);
    }
  }

  // --- Mappers ---

  private mapToRole(row: any): RoleResponseDTO {
    return {
      id: row.id,
      urn: row.urn,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  private mapToPermission(row: any): PermissionResponseDTO {
    return {
      id: row.id,
      urn: row.urn,
      description: row.description,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
}

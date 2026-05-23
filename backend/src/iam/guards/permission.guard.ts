import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { PERMISSION_KEY, ADMIN_PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly supabase: SupabaseClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isAdminOnly && !requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Resolve user's permissions by joining iam_user_roles, iam_role_permissions, iam_permissions, iam_roles
    const { data: userRoles, error } = await this.supabase
      .from('iam_user_roles')
      .select(`
        role:iam_roles!inner(
          urn,
          iam_role_permissions(
            permission:iam_permissions!inner(urn)
          )
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('IAM Permission resolve error:', error);
      throw new ForbiddenException('Unable to resolve permissions');
    }

    const grantedPermissions = new Set<string>();
    const roles = new Set<string>();

    for (const ur of userRoles || []) {
      const role = ur.role as any;
      if (role?.urn) roles.add(role.urn);
      for (const rp of role?.iam_role_permissions || []) {
        if (rp.permission?.urn) grantedPermissions.add(rp.permission.urn);
      }
    }

    // Admin role bypasses all checks
    if (roles.has('role:user:admin')) {
      return true;
    }

    if (isAdminOnly && !roles.has('role:user:admin')) {
      throw new ForbiddenException('Admin access required');
    }

    if (requiredPermission && !grantedPermissions.has(requiredPermission)) {
      throw new ForbiddenException(`Missing required permission: ${requiredPermission}`);
    }

    return true;
  }
}

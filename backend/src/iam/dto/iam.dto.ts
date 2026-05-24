import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createRoleSchema = z.object({
  urn: z.string().min(3).regex(/^role:[a-zA-Z0-9:]+$/, 'Role URN must start with "role:" and contain alphanumeric characters or colons'),
  description: z.string().optional(),
});
export class CreateRoleDTO extends createZodDto(createRoleSchema) {}

export const updateRoleSchema = z.object({
  urn: z.string().min(3).regex(/^role:[a-zA-Z0-9:]+$/, 'Role URN must start with "role:" and contain alphanumeric characters or colons').optional(),
  description: z.string().optional(),
});
export class UpdateRoleDTO extends createZodDto(updateRoleSchema) {}

export const createPermissionSchema = z.object({
  urn: z.string().min(3).regex(/^action:[a-zA-Z0-9:]+$/, 'Permission URN must start with "action:" and contain alphanumeric characters or colons'),
  description: z.string().optional(),
});
export class CreatePermissionDTO extends createZodDto(createPermissionSchema) {}

export const updatePermissionSchema = z.object({
  urn: z.string().min(3).regex(/^action:[a-zA-Z0-9:]+$/, 'Permission URN must start with "action:" and contain alphanumeric characters or colons').optional(),
  description: z.string().optional(),
});
export class UpdatePermissionDTO extends createZodDto(updatePermissionSchema) {}

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});
export class UpdateRolePermissionsDTO extends createZodDto(updateRolePermissionsSchema) {}

export const roleResponseSchema = z.object({
  id: z.string().uuid(),
  urn: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export class RoleResponseDTO extends createZodDto(roleResponseSchema) {}

export const permissionResponseSchema = z.object({
  id: z.string().uuid(),
  urn: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export class PermissionResponseDTO extends createZodDto(permissionResponseSchema) {}

import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'iam_permission';
export const Permission = (urn: string) => SetMetadata(PERMISSION_KEY, urn);

export const ROLE_KEY = 'iam_role';
export const RequireRole = (role: 'admin' | 'operator') => SetMetadata(ROLE_KEY, role);

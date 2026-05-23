import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'iam_permission';
export const Permission = (urn: string) => SetMetadata(PERMISSION_KEY, urn);

export const ADMIN_PERMISSION_KEY = 'iam_admin_permission';
export const AdminPermission = () => SetMetadata(ADMIN_PERMISSION_KEY, true);

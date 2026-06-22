import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'iam_permission';
export const Permission = (urn: string) => SetMetadata(PERMISSION_KEY, urn);

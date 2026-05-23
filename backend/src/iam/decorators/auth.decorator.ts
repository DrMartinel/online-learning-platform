import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { Permission } from './permission.decorator';

export function Auth(permissionUrn?: string) {
  const decorators = [
    UseGuards(AuthGuard, PermissionGuard),
    ApiBearerAuth(),
  ];

  if (permissionUrn) {
    decorators.push(Permission(permissionUrn));
  }

  return applyDecorators(...decorators);
}



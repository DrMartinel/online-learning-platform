import { Module, Global } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { IamAdminController } from './controllers/iam.admin.controller';
import { IamAdminService } from './services/iam-admin.service';

@Global()
@Module({
  controllers: [IamAdminController],
  providers: [AuthGuard, PermissionGuard, IamAdminService],
  exports: [AuthGuard, PermissionGuard],
})
export class IamModule {}

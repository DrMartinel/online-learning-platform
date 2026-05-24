import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IamAdminService } from '../services/iam-admin.service';
import { 
  CreateRoleDTO, 
  UpdateRoleDTO, 
  CreatePermissionDTO, 
  UpdatePermissionDTO,
  UpdateRolePermissionsDTO,
  RoleResponseDTO,
  PermissionResponseDTO
} from '../dto/iam.dto';
import { Auth } from '../decorators/auth.decorator';

@ApiTags('Admin IAM')
@ApiBearerAuth()
@Controller('admin/iam')
export class IamAdminController {
  constructor(private readonly iamAdminService: IamAdminService) {}

  // --- Roles ---

  @Get('roles')
  @ApiOperation({ summary: 'List all IAM roles' })
  @Auth('action:admin:iam:manage')
  async listRoles(): Promise<RoleResponseDTO[]> {
    return this.iamAdminService.listRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new IAM role' })
  @Auth('action:admin:iam:manage')
  async createRole(@Body() dto: CreateRoleDTO): Promise<RoleResponseDTO> {
    return this.iamAdminService.createRole(dto);
  }

  @Put('roles/:id')
  @ApiOperation({ summary: 'Update an existing IAM role' })
  @Auth('action:admin:iam:manage')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDTO
  ): Promise<RoleResponseDTO> {
    return this.iamAdminService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete an IAM role' })
  @Auth('action:admin:iam:manage')
  async deleteRole(@Param('id') id: string): Promise<void> {
    return this.iamAdminService.deleteRole(id);
  }

  // --- Permissions ---

  @Get('permissions')
  @ApiOperation({ summary: 'List all IAM permissions' })
  @Auth('action:admin:iam:manage')
  async listPermissions(): Promise<PermissionResponseDTO[]> {
    return this.iamAdminService.listPermissions();
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create a new IAM permission' })
  @Auth('action:admin:iam:manage')
  async createPermission(@Body() dto: CreatePermissionDTO): Promise<PermissionResponseDTO> {
    return this.iamAdminService.createPermission(dto);
  }

  @Put('permissions/:id')
  @ApiOperation({ summary: 'Update an existing IAM permission' })
  @Auth('action:admin:iam:manage')
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDTO
  ): Promise<PermissionResponseDTO> {
    return this.iamAdminService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Delete an IAM permission' })
  @Auth('action:admin:iam:manage')
  async deletePermission(@Param('id') id: string): Promise<void> {
    return this.iamAdminService.deletePermission(id);
  }

  // --- Role Permissions ---

  @Get('roles/:id/permissions')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @Auth('action:admin:iam:manage')
  async getRolePermissions(@Param('id') id: string): Promise<string[]> {
    return this.iamAdminService.getRolePermissions(id);
  }

  @Put('roles/:id/permissions')
  @ApiOperation({ summary: 'Update permissions assigned to a role' })
  @Auth('action:admin:iam:manage')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDTO
  ): Promise<void> {
    return this.iamAdminService.updateRolePermissions(id, dto.permissionIds);
  }
}

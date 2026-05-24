import { Test, TestingModule } from '@nestjs/testing';
import { IamAdminController } from '../controllers/iam.admin.controller';
import { IamAdminService } from '../services/iam-admin.service';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionGuard } from '../guards/permission.guard';

describe('IamAdminController', () => {
  let controller: IamAdminController;
  let service: IamAdminService;

  const mockRole = { id: 'r1', urn: 'role:admin', description: 'Admin', createdAt: new Date(), updatedAt: new Date() };
  const mockPermission = { id: 'p1', urn: 'action:read', description: 'Read', createdAt: new Date(), updatedAt: new Date() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IamAdminController],
      providers: [
        {
          provide: IamAdminService,
          useValue: {
            listRoles: jest.fn().mockResolvedValue([mockRole]),
            createRole: jest.fn().mockResolvedValue(mockRole),
            updateRole: jest.fn().mockResolvedValue(mockRole),
            deleteRole: jest.fn().mockResolvedValue(undefined),
            listPermissions: jest.fn().mockResolvedValue([mockPermission]),
            createPermission: jest.fn().mockResolvedValue(mockPermission),
            updatePermission: jest.fn().mockResolvedValue(mockPermission),
            deletePermission: jest.fn().mockResolvedValue(undefined),
            getRolePermissions: jest.fn().mockResolvedValue(['p1', 'p2']),
            updateRolePermissions: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<IamAdminController>(IamAdminController);
    service = module.get<IamAdminService>(IamAdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- Roles ---

  it('should list roles', async () => {
    const result = await controller.listRoles();
    expect(result).toEqual([mockRole]);
    expect(service.listRoles).toHaveBeenCalled();
  });

  it('should create a role', async () => {
    const dto = { urn: 'role:admin', description: 'Admin' };
    const result = await controller.createRole(dto);
    expect(result).toEqual(mockRole);
    expect(service.createRole).toHaveBeenCalledWith(dto);
  });

  it('should update a role', async () => {
    const dto = { urn: 'role:updated' };
    const result = await controller.updateRole('r1', dto);
    expect(result).toEqual(mockRole);
    expect(service.updateRole).toHaveBeenCalledWith('r1', dto);
  });

  it('should delete a role', async () => {
    await expect(controller.deleteRole('r1')).resolves.toBeUndefined();
    expect(service.deleteRole).toHaveBeenCalledWith('r1');
  });

  // --- Permissions ---

  it('should list permissions', async () => {
    const result = await controller.listPermissions();
    expect(result).toEqual([mockPermission]);
    expect(service.listPermissions).toHaveBeenCalled();
  });

  it('should create a permission', async () => {
    const dto = { urn: 'action:read', description: 'Read' };
    const result = await controller.createPermission(dto);
    expect(result).toEqual(mockPermission);
    expect(service.createPermission).toHaveBeenCalledWith(dto);
  });

  it('should update a permission', async () => {
    const dto = { urn: 'action:updated' };
    const result = await controller.updatePermission('p1', dto);
    expect(result).toEqual(mockPermission);
    expect(service.updatePermission).toHaveBeenCalledWith('p1', dto);
  });

  it('should delete a permission', async () => {
    await expect(controller.deletePermission('p1')).resolves.toBeUndefined();
    expect(service.deletePermission).toHaveBeenCalledWith('p1');
  });

  // --- Role Permissions ---

  it('should get role permissions', async () => {
    const result = await controller.getRolePermissions('r1');
    expect(result).toEqual(['p1', 'p2']);
    expect(service.getRolePermissions).toHaveBeenCalledWith('r1');
  });

  it('should update role permissions', async () => {
    const dto = { permissionIds: ['p1', 'p2'] };
    await expect(controller.updateRolePermissions('r1', dto)).resolves.toBeUndefined();
    expect(service.updateRolePermissions).toHaveBeenCalledWith('r1', ['p1', 'p2']);
  });
});

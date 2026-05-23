import { Test, TestingModule } from '@nestjs/testing';
import { UserAdminController } from '../controllers/admin/user.admin.controller';
import { UserService } from '../services/user.service';
import { AuthGuard } from '../../iam/guards/auth.guard';
import { PermissionGuard } from '../../iam/guards/permission.guard';
import { AdminUpdateUserDTO } from '../dto/user-admin.dto';

describe('UserAdminController', () => {
  let controller: UserAdminController;
  let service: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockService = {
      adminListUsers: jest.fn(),
      getProfile: jest.fn(),
      adminUpdateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAdminController],
      providers: [
        {
          provide: UserService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<UserAdminController>(UserAdminController);
    service = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list users', async () => {
    service.adminListUsers.mockResolvedValue([{ id: '1' }] as any);
    expect(await controller.listUsers()).toEqual([{ id: '1' }]);
    expect(service.adminListUsers).toHaveBeenCalled();
  });

  it('should get user profile', async () => {
    service.getProfile.mockResolvedValue({ id: '1' } as any);
    expect(await controller.getUser('1')).toEqual({ id: '1' });
    expect(service.getProfile).toHaveBeenCalledWith('1');
  });

  it('should update user profile', async () => {
    const dto: AdminUpdateUserDTO = { fullName: 'Updated' } as any;
    service.adminUpdateProfile.mockResolvedValue({ id: '1' } as any);
    expect(await controller.updateUser('1', dto)).toEqual({ id: '1' });
    expect(service.adminUpdateProfile).toHaveBeenCalledWith('1', dto);
  });
});

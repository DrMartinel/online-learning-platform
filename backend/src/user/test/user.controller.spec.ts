import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            getProfile: jest.fn().mockResolvedValue({ id: '1' }),
            updateProfile: jest.fn().mockResolvedValue({ id: '1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get a profile', async () => {
    await expect(controller.getProfile('1')).resolves.toEqual({ id: '1' });
    expect(service.getProfile).toHaveBeenCalledWith('1');
  });

  it('should update a profile', async () => {
    await expect(controller.updateProfile('1', { fullName: 'New' })).resolves.toEqual({ id: '1' });
    expect(service.updateProfile).toHaveBeenCalledWith('1', { fullName: 'New' });
  });

  it('should throw UnauthorizedException if id not provided', async () => {
    await expect(controller.getProfile('')).rejects.toThrow('Unauthorized');
  });

  it('should throw UnauthorizedException on update if id not provided', async () => {
    await expect(controller.updateProfile('', { fullName: 'New' })).rejects.toThrow('Unauthorized');
  });
});

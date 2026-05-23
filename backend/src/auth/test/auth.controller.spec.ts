import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signUp: jest.fn().mockResolvedValue({ accessToken: 'mock-access', refreshToken: 'mock-refresh', userId: '1', role: 'student' }),
            signIn: jest.fn().mockResolvedValue({ accessToken: 'mock-access', refreshToken: 'mock-refresh', userId: '1', role: 'student' }),
            signOut: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should sign up a user', async () => {
    const result = await controller.signUp({ email: 'test@test.com', password: 'pass', fullName: 'Test User' });
    expect(result.accessToken).toEqual('mock-access');
    expect(authService.signUp).toHaveBeenCalledWith({ email: 'test@test.com', password: 'pass', fullName: 'Test User' });
  });

  it('should sign in a user', async () => {
    const result = await controller.signIn({ email: 'test@test.com', password: 'pass' });
    expect(result.accessToken).toEqual('mock-access');
    expect(authService.signIn).toHaveBeenCalledWith({ email: 'test@test.com', password: 'pass' });
  });

  it('should sign out a user', async () => {
    const result = await controller.signOut();
    expect(result).toBeUndefined();
    expect(authService.signOut).toHaveBeenCalled();
  });
});

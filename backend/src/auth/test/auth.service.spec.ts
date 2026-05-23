import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../services/auth.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserAlreadyExistsError, AuthenticationError } from '../AuthErrors';

describe('AuthService', () => {
  let service: AuthService;
  let authRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'IAuthRepository',
          useValue: {
            signUp: jest.fn(),
            signIn: jest.fn(),
            signOut: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepo = module.get('IAuthRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      authRepo.signUp.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', userId: '1', role: 'student', expiresAt: 123 });
      const result = await service.signUp({ email: 'test@test.com', password: '123', fullName: 'Test' });
      expect(result.accessToken).toBe('a');
    });

    it('should throw ConflictException if user exists', async () => {
      authRepo.signUp.mockRejectedValue(new UserAlreadyExistsError('test@test.com'));
      await expect(service.signUp({ email: 'test@test.com', password: '123', fullName: 'Test' })).rejects.toThrow(ConflictException);
    });

    it('should throw UnauthorizedException for other errors', async () => {
      authRepo.signUp.mockRejectedValue(new AuthenticationError('Invalid'));
      await expect(service.signUp({ email: 'test@test.com', password: '123', fullName: 'Test' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      authRepo.signIn.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', userId: '1', role: 'student', expiresAt: 123 });
      const result = await service.signIn({ email: 'test@test.com', password: '123' });
      expect(result.accessToken).toBe('a');
    });

    it('should throw UnauthorizedException on failure', async () => {
      authRepo.signIn.mockRejectedValue(new AuthenticationError('Invalid'));
      await expect(service.signIn({ email: 'test@test.com', password: '123' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      authRepo.signOut.mockResolvedValue(undefined);
      await expect(service.signOut()).resolves.toBeUndefined();
    });

    it('should throw UnauthorizedException on failure', async () => {
      authRepo.signOut.mockRejectedValue(new AuthenticationError('Failed'));
      await expect(service.signOut()).rejects.toThrow(UnauthorizedException);
    });
  });
});

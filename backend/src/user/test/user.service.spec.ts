import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserService } from '../services/user.service';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/User';

describe('UserService', () => {
  let service: UserService;
  let repo: any;
  let supabaseClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: SupabaseClient,
          useValue: {
            auth: {
              admin: {
                createUser: jest.fn(),
              },
            },
            from: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: 'mock-role-id' }, error: null }),
              delete: jest.fn().mockReturnThis(),
              insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get('IUserRepository');
    supabaseClient = module.get(SupabaseClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return a profile', async () => {
      const u = new User('1', 'e@e.com', 'F', 'student', undefined, undefined, new Date());
      repo.findById.mockResolvedValue(u);
      const result = await service.getProfile('1');
      expect(result.id).toBe('1');
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getProfile('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update a profile', async () => {
      const u = new User('1', 'e@e.com', 'F', 'student', undefined, undefined, new Date());
      repo.findById.mockResolvedValue(u);
      repo.save.mockResolvedValue(u);
      const result = await service.updateProfile('1', { fullName: 'New', bio: 'B', avatarUrl: 'A' });
      expect(result.fullName).toBe('New');
      expect(result.bio).toBe('B');
      expect(result.avatarUrl).toBe('A');
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.updateProfile('1', { fullName: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('admin methods', () => {
    it('should list all users as admin', async () => {
      const u = new User('1', 'e@e.com', 'F', 'student', undefined, undefined, new Date());
      repo.findAll.mockResolvedValue([u]);
      const result = await service.adminListUsers();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });

    it('should update user profile as admin', async () => {
      const u = new User('1', 'e@e.com', 'F', 'student', undefined, undefined, new Date());
      repo.findById.mockResolvedValue(u);
      repo.save.mockResolvedValue(u);
      const result = await service.adminUpdateProfile('1', { fullName: 'New', role: 'operator' });
      expect(result.fullName).toBe('New');
      expect(result.role).toBe('operator');
    });

    it('should throw if user to admin update is not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.adminUpdateProfile('1', { fullName: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should create a user as admin', async () => {
      const u = new User('1', 'test@test.com', 'New', 'admin', undefined, undefined, new Date());
      supabaseClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: '1' } },
        error: null,
      });
      repo.findById.mockResolvedValue(u);
      repo.save.mockResolvedValue(u);

      const result = await service.adminCreateUser({
        email: 'test@test.com',
        fullName: 'New',
        role: 'admin',
        password: 'password123',
      });

      expect(supabaseClient.auth.admin.createUser).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@test.com',
        password: 'password123',
      }));
      expect(result.id).toBe('1');
    });
  });
});

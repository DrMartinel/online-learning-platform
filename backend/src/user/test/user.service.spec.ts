import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../services/user.service';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/User';

describe('UserService', () => {
  let service: UserService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: 'IUserRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get('IUserRepository');
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
});

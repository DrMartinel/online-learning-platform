import { Test, TestingModule } from '@nestjs/testing';
import { UserProgressService } from '../services/user-progress.service';
import { NotFoundException } from '@nestjs/common';

describe('UserProgressService', () => {
  let service: UserProgressService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProgressService,
        {
          provide: 'IUserProgressRepository',
          useValue: {
            createOrUpdate: jest.fn(),
            findByLesson: jest.fn(),
            findByCourse: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserProgressService>(UserProgressService);
    repo = module.get('IUserProgressRepository');
  });

  it('should create progress', async () => {
    repo.createOrUpdate.mockResolvedValue({ courseId: 'c1' });
    const result = await service.createProgress('u1', { courseId: 'c1', lessonId: 'l1' });
    expect(result).toBeDefined();
  });

  it('should get lesson progress', async () => {
    repo.findByLesson.mockResolvedValue({ courseId: 'c1' });
    const result = await service.getLessonProgress('u1', 'l1');
    expect(result).toBeDefined();
  });

  it('should get lesson progress null', async () => {
    repo.findByLesson.mockResolvedValue(null);
    const result = await service.getLessonProgress('u1', 'l1');
    expect(result).toBeNull();
  });

  describe('getCourseProgress', () => {
    it('should calculate progress correctly', async () => {
      repo.findByCourse.mockResolvedValue([{ isCompleted: true }, { isCompleted: false }]);
      const result = await service.getCourseProgress('u1', 'c1');
      expect(result.totalLessons).toBe(2);
      expect(result.completedLessons).toBe(1);
      expect(result.progressPercentage).toBe(50);
    });

    it('should calculate 0% for empty lessons', async () => {
      repo.findByCourse.mockResolvedValue([]);
      const result = await service.getCourseProgress('u1', 'c1');
      expect(result.progressPercentage).toBe(0);
    });
  });

  describe('updateProgress', () => {
    it('should update progress', async () => {
      repo.findByLesson.mockResolvedValue({ courseId: 'c1', isCompleted: false, lastPosition: 0 });
      repo.createOrUpdate.mockResolvedValue({ courseId: 'c1', isCompleted: true, lastPosition: 10 });
      const result = await service.updateProgress('u1', 'l1', { isCompleted: true, lastPosition: 10 });
      expect(result).toBeDefined();
    });

    it('should update progress with defaults', async () => {
      repo.findByLesson.mockResolvedValue({ courseId: 'c1', isCompleted: false, lastPosition: 0 });
      repo.createOrUpdate.mockResolvedValue({ courseId: 'c1', isCompleted: false, lastPosition: 0 });
      const result = await service.updateProgress('u1', 'l1', {});
      expect(result).toBeDefined();
    });

    it('should throw if not found', async () => {
      repo.findByLesson.mockResolvedValue(null);
      await expect(service.updateProgress('u1', 'l1', {})).rejects.toThrow(NotFoundException);
    });
  });
});

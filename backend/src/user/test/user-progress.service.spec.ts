import { Test, TestingModule } from '@nestjs/testing';
import { UserProgressService } from '../services/user-progress.service';

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
            countCourseLessons: jest.fn(),
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
      repo.findByCourse.mockResolvedValue([
        { isCompleted: true, lessonId: 'l1' },
        { isCompleted: false, lessonId: 'l2' },
      ]);
      repo.countCourseLessons.mockResolvedValue(3);
      const result = await service.getCourseProgress('u1', 'c1');
      expect(result.totalLessonsCount).toBe(3);
      expect(result.completedLessonsCount).toBe(1);
      expect(result.percentage).toBe(33);
      expect(result.progress).toHaveLength(2);
    });

    it('should calculate 0% when no lessons', async () => {
      repo.findByCourse.mockResolvedValue([]);
      repo.countCourseLessons.mockResolvedValue(0);
      const result = await service.getCourseProgress('u1', 'c1');
      expect(result.percentage).toBe(0);
    });
  });

  describe('updateProgress', () => {
    it('should upsert progress when record exists', async () => {
      repo.findByLesson.mockResolvedValue({ courseId: 'c1', isCompleted: false });
      repo.createOrUpdate.mockResolvedValue({ courseId: 'c1', isCompleted: true });
      const result = await service.updateProgress('u1', 'l1', { isCompleted: true });
      expect(result).toBeDefined();
    });

    it('should upsert progress even when no existing record', async () => {
      repo.findByLesson.mockResolvedValue(null);
      repo.createOrUpdate.mockResolvedValue({ lessonId: 'l1', isCompleted: true });
      const result = await service.updateProgress('u1', 'l1', { isCompleted: true });
      expect(result).toBeDefined();
    });
  });
});

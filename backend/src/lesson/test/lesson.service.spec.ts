import { Test, TestingModule } from '@nestjs/testing';
import { LessonService } from '../services/lesson.service';
import { NotFoundException } from '@nestjs/common';

describe('LessonService', () => {
  let service: LessonService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonService,
        {
          provide: 'ILessonRepository',
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByCourseId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LessonService>(LessonService);
    repo = module.get('ILessonRepository');
  });

  it('should create a lesson', async () => {
    repo.create.mockResolvedValue({ id: '1', courseId: 'c1', title: 'T', orderIndex: 1, createdAt: new Date().toISOString() });
    const result = await service.create({ courseId: 'c1', title: 'T', orderIndex: 1, content: 'c', videoUrl: 'v' });
    expect(result.id).toBe('1');
    expect(repo.create).toHaveBeenCalled();
  });

  describe('findById', () => {
    it('should find a lesson', async () => {
      repo.findById.mockResolvedValue({ id: '1', courseId: 'c1', title: 'T', orderIndex: 1, createdAt: new Date().toISOString() });
      const result = await service.findById('1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  it('should find by course id', async () => {
    repo.findByCourseId.mockResolvedValue([{ id: '1', courseId: 'c1', title: 'T', orderIndex: 1, createdAt: new Date().toISOString() }]);
    const result = await service.findByCourseId('c1');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  describe('update', () => {
    it('should update a lesson', async () => {
      repo.findById.mockResolvedValue({ id: '1', courseId: 'c1', title: 'T', orderIndex: 1, createdAt: new Date().toISOString() });
      repo.update.mockResolvedValue({ id: '1', courseId: 'c1', title: 'New', orderIndex: 1, createdAt: new Date().toISOString() });

      const result = await service.update('1', { title: 'New', content: 'C', videoUrl: 'V', orderIndex: 2 });
      expect(result.title).toBe('New');
    });

    it('should throw if lesson not found initially', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('1', { title: 'New' })).rejects.toThrow(NotFoundException);
    });

    it('should throw if update returns null', async () => {
      repo.findById.mockResolvedValue({ id: '1', courseId: 'c1', title: 'T', orderIndex: 1, createdAt: new Date().toISOString() });
      repo.update.mockResolvedValue(null);
      await expect(service.update('1', { title: 'New' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a lesson', async () => {
      repo.findById.mockResolvedValue({ id: '1', courseId: 'c1', title: 'T', orderIndex: 1, createdAt: new Date().toISOString() });
      repo.delete.mockResolvedValue(undefined);
      await expect(service.delete('1')).resolves.toBeUndefined();
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete('1')).rejects.toThrow(NotFoundException);
    });
  });
});

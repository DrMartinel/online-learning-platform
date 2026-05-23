import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from '../services/course.service';
import { Course } from '../entities/Course';
import { CourseError } from '../CourseErrors';

describe('CourseService', () => {
  let service: CourseService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        {
          provide: 'ICourseRepository',
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    repo = module.get('ICourseRepository');
  });

  it('should create a course', async () => {
    repo.create.mockImplementation(async (c: Course) => c);
    const result = await service.create('inst1', { title: 'Test' });
    expect(result.title).toBe('Test');
    expect(result.instructorId).toBe('inst1');
  });

  describe('findById', () => {
    it('should find a course', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
      repo.findById.mockResolvedValue(c);
      const result = await service.findById('1');
      expect(result.id).toBe('1');
    });

    it('should throw CourseError if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('1')).rejects.toThrow(CourseError);
    });
  });

  it('should list courses', async () => {
    const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
    repo.findAll.mockResolvedValue([c]);
    const result = await service.list({});
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });

  describe('update', () => {
    it('should update a course', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
      repo.findById.mockResolvedValue(c);
      repo.update.mockResolvedValue(c);

      const result = await service.update('1', { title: 'New', description: 'Desc', thumbnailUrl: 'url', isPublished: true }, 'inst1');
      expect(result.title).toBe('New');
      expect(result.description).toBe('Desc');
      expect(result.thumbnailUrl).toBe('url');
      expect(result.isPublished).toBe(true);
    });

    it('should unpublish a course', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, true, new Date());
      repo.findById.mockResolvedValue(c);
      repo.update.mockResolvedValue(c);

      const result = await service.update('1', { isPublished: false }, 'inst1');
      expect(result.isPublished).toBe(false);
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('1', { title: 'New' }, 'inst1')).rejects.toThrow('Course not found');
    });

    it('should throw if not instructor', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
      repo.findById.mockResolvedValue(c);
      await expect(service.update('1', { title: 'New' }, 'inst2')).rejects.toThrow('You do not have permission');
    });
  });

  describe('delete', () => {
    it('should delete a course', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
      repo.findById.mockResolvedValue(c);
      repo.delete.mockResolvedValue(undefined);
      await expect(service.delete('1', 'inst1')).resolves.toBeUndefined();
    });

    it('should throw if not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.delete('1', 'inst1')).rejects.toThrow('Course not found');
    });

    it('should throw if not instructor', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
      repo.findById.mockResolvedValue(c);
      await expect(service.delete('1', 'inst2')).rejects.toThrow('You do not have permission');
    });
  });

  describe('admin methods', () => {
    it('should create a course as admin', async () => {
      repo.create.mockImplementation(async (c: Course) => c);
      const result = await service.adminCreate({ title: 'Test', instructorId: 'inst99' });
      expect(result.title).toBe('Test');
      expect(result.instructorId).toBe('inst99');
    });

    it('should update a course as admin', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
      repo.findById.mockResolvedValue(c);
      repo.update.mockResolvedValue(c);

      const result = await service.adminUpdate('1', { title: 'New', description: 'Desc', thumbnailUrl: 'url', instructorId: 'inst99', isPublished: true });
      expect(result.title).toBe('New');
      expect(result.description).toBe('Desc');
      expect(result.thumbnailUrl).toBe('url');
      expect(result.instructorId).toBe('inst99');
      expect(result.isPublished).toBe(true);
    });

    it('should unpublish a course as admin', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, true, new Date());
      repo.findById.mockResolvedValue(c);
      repo.update.mockResolvedValue(c);

      const result = await service.adminUpdate('1', { isPublished: false });
      expect(result.isPublished).toBe(false);
    });

    it('should throw if course to admin update is not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.adminUpdate('1', { title: 'New' })).rejects.toThrow('Course not found');
    });

    it('should delete a course as admin', async () => {
      const c = new Course('1', 'inst1', 'Test', null, null, false, new Date());
      repo.findById.mockResolvedValue(c);
      repo.delete.mockResolvedValue(undefined);
      await expect(service.adminDelete('1')).resolves.toBeUndefined();
    });

    it('should throw if course to admin delete is not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.adminDelete('1')).rejects.toThrow('Course not found');
    });
  });
});

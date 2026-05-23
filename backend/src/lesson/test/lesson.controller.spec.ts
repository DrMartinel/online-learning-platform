import { Test, TestingModule } from '@nestjs/testing';
import { LessonController } from '../controllers/lesson.controller';
import { LessonService } from '../services/lesson.service';

describe('LessonController', () => {
  let controller: LessonController;
  let service: LessonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonController],
      providers: [
        {
          provide: LessonService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findById: jest.fn().mockResolvedValue({ id: '1' }),
            findByCourseId: jest.fn().mockResolvedValue([{ id: '1' }]),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<LessonController>(LessonController);
    service = module.get<LessonService>(LessonService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a lesson', async () => {
    await expect(controller.createLesson({ courseId: 'c1', title: 'T', orderIndex: 1 })).resolves.toEqual({ id: '1' });
    expect(service.create).toHaveBeenCalledWith({ courseId: 'c1', title: 'T', orderIndex: 1 });
  });

  it('should list lessons', async () => {
    await expect(controller.listLessons('c1', true)).resolves.toEqual([{ id: '1' }]);
    expect(service.findByCourseId).toHaveBeenCalledWith('c1', true);
  });

  it('should get a lesson', async () => {
    await expect(controller.getLesson('1')).resolves.toEqual({ id: '1' });
    expect(service.findById).toHaveBeenCalledWith('1');
  });

  it('should update a lesson', async () => {
    await expect(controller.updateLesson('1', { title: 'New' })).resolves.toEqual({ id: '1' });
    expect(service.update).toHaveBeenCalledWith('1', { title: 'New' });
  });

  it('should delete a lesson', async () => {
    await expect(controller.deleteLesson('1')).resolves.toBeUndefined();
    expect(service.delete).toHaveBeenCalledWith('1');
  });
});

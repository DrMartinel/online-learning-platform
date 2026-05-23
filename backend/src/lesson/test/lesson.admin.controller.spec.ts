import { Test, TestingModule } from '@nestjs/testing';
import { LessonAdminController } from '../controllers/admin/lesson.admin.controller';
import { LessonService } from '../services/lesson.service';
import { AuthGuard } from '../../iam/guards/auth.guard';
import { PermissionGuard } from '../../iam/guards/permission.guard';
import { CreateLessonDTO, UpdateLessonDTO } from '../dto/lesson.dto';

describe('LessonAdminController', () => {
  let controller: LessonAdminController;
  let service: jest.Mocked<LessonService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findByCourseId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LessonAdminController],
      providers: [
        {
          provide: LessonService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<LessonAdminController>(LessonAdminController);
    service = module.get(LessonService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create lesson', async () => {
    const dto: CreateLessonDTO = { title: 'Test', courseId: '1', orderIndex: 1 } as any;
    service.create.mockResolvedValue({ id: '1' } as any);
    expect(await controller.createLesson(dto)).toEqual({ id: '1' });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should list lessons', async () => {
    service.findByCourseId.mockResolvedValue([{ id: '1' }] as any);
    expect(await controller.listLessons('1')).toEqual([{ id: '1' }]);
    expect(service.findByCourseId).toHaveBeenCalledWith('1', undefined);
  });

  it('should get lesson by id', async () => {
    service.findById.mockResolvedValue({ id: '1' } as any);
    expect(await controller.getLesson('1')).toEqual({ id: '1' });
    expect(service.findById).toHaveBeenCalledWith('1');
  });

  it('should update lesson', async () => {
    const dto: UpdateLessonDTO = { title: 'Updated' } as any;
    service.update.mockResolvedValue({ id: '1' } as any);
    expect(await controller.updateLesson('1', dto)).toEqual({ id: '1' });
    expect(service.update).toHaveBeenCalledWith('1', dto);
  });

  it('should delete lesson', async () => {
    service.delete.mockResolvedValue(undefined);
    await controller.deleteLesson('1');
    expect(service.delete).toHaveBeenCalledWith('1');
  });
});

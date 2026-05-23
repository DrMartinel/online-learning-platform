import { Test, TestingModule } from '@nestjs/testing';
import { UserProgressController } from '../controllers/user-progress.controller';
import { UserProgressService } from '../services/user-progress.service';
import { AuthGuard } from '../../iam/guards/auth.guard';
import { PermissionGuard } from '../../iam/guards/permission.guard';

describe('UserProgressController', () => {
  let controller: UserProgressController;
  let service: UserProgressService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProgressController],
      providers: [
        {
          provide: UserProgressService,
          useValue: {
            createProgress: jest.fn().mockResolvedValue({ courseId: 'c1' }),
            getLessonProgress: jest.fn().mockResolvedValue({ courseId: 'c1' }),
            getCourseProgress: jest.fn().mockResolvedValue({ courseId: 'c1', progressPercentage: 100 }),
            updateProgress: jest.fn().mockResolvedValue({ courseId: 'c1' }),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserProgressController>(UserProgressController);
    service = module.get<UserProgressService>(UserProgressService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create progress', async () => {
    await expect(controller.createProgress({ id: 'u1' }, { courseId: 'c1', lessonId: 'l1' })).resolves.toEqual({ courseId: 'c1' });
    expect(service.createProgress).toHaveBeenCalledWith('u1', { courseId: 'c1', lessonId: 'l1' });
  });

  it('should get lesson progress', async () => {
    await expect(controller.getLessonProgress({ id: 'u1' }, 'l1')).resolves.toEqual({ courseId: 'c1' });
    expect(service.getLessonProgress).toHaveBeenCalledWith('u1', 'l1');
  });

  it('should get course progress', async () => {
    await expect(controller.getCourseProgress({ id: 'u1' }, 'c1')).resolves.toEqual({ courseId: 'c1', progressPercentage: 100 });
    expect(service.getCourseProgress).toHaveBeenCalledWith('u1', 'c1');
  });

  it('should update progress', async () => {
    await expect(controller.updateProgress({ id: 'u1' }, 'l1', { isCompleted: true })).resolves.toEqual({ courseId: 'c1' });
    expect(service.updateProgress).toHaveBeenCalledWith('u1', 'l1', { isCompleted: true });
  });

  it('should throw UnauthorizedException on create if no user', async () => {
    await expect(controller.createProgress(null, { courseId: 'c', lessonId: 'l' })).rejects.toThrow('Unauthorized');
  });
  
  it('should throw UnauthorizedException on get lesson if no user', async () => {
    await expect(controller.getLessonProgress(null, 'l')).rejects.toThrow('Unauthorized');
  });

  it('should throw UnauthorizedException on get course if no user', async () => {
    await expect(controller.getCourseProgress(null, 'c')).rejects.toThrow('Unauthorized');
  });

  it('should throw UnauthorizedException on update if no user', async () => {
    await expect(controller.updateProgress(null, 'l', {})).rejects.toThrow('Unauthorized');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CourseController } from '../controllers/course.controller';
import { CourseService } from '../services/course.service';
import { AuthGuard } from '../../iam/guards/auth.guard';
import { PermissionGuard } from '../../iam/guards/permission.guard';

describe('CourseController', () => {
  let controller: CourseController;
  let service: CourseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        {
          provide: CourseService,
          useValue: {
            create: jest.fn().mockResolvedValue({ id: '1' }),
            findById: jest.fn().mockResolvedValue({ id: '1' }),
            list: jest.fn().mockResolvedValue([{ id: '1' }]),
            update: jest.fn().mockResolvedValue({ id: '1' }),
            delete: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CourseController>(CourseController);
    service = module.get<CourseService>(CourseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a course', async () => {
    await expect(controller.createCourse({ id: 'inst1' }, { title: 'Test' })).resolves.toEqual({ id: '1' });
    expect(service.create).toHaveBeenCalledWith('inst1', { title: 'Test' });
  });

  it('should get a course', async () => {
    await expect(controller.getCourse('1')).resolves.toEqual({ id: '1' });
    expect(service.findById).toHaveBeenCalledWith('1');
  });

  it('should list courses', async () => {
    await expect(controller.listCourses({})).resolves.toEqual([{ id: '1' }]);
    expect(service.list).toHaveBeenCalledWith({});
  });

  it('should update a course', async () => {
    await expect(controller.updateCourse('1', { id: 'inst1' }, { title: 'New' })).resolves.toEqual({ id: '1' });
    expect(service.update).toHaveBeenCalledWith('1', { title: 'New' }, 'inst1');
  });

  it('should delete a course', async () => {
    await expect(controller.deleteCourse('1', { id: 'inst1' })).resolves.toBeUndefined();
    expect(service.delete).toHaveBeenCalledWith('1', 'inst1');
  });
});

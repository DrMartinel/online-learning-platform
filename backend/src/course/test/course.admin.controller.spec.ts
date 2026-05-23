import { Test, TestingModule } from '@nestjs/testing';
import { CourseAdminController } from '../controllers/admin/course.admin.controller';
import { CourseService } from '../services/course.service';
import { AuthGuard } from '../../iam/guards/auth.guard';
import { PermissionGuard } from '../../iam/guards/permission.guard';
import { AdminCreateCourseDTO, AdminUpdateCourseDTO } from '../dto/course-admin.dto';

describe('CourseAdminController', () => {
  let controller: CourseAdminController;
  let service: jest.Mocked<CourseService>;

  beforeEach(async () => {
    const mockService = {
      adminCreate: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      adminUpdate: jest.fn(),
      adminDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseAdminController],
      providers: [
        {
          provide: CourseService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<CourseAdminController>(CourseAdminController);
    service = module.get(CourseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create course', async () => {
    const dto: AdminCreateCourseDTO = { title: 'Test', instructorId: 'inst-1' } as any;
    service.adminCreate.mockResolvedValue({ id: '1' } as any);
    expect(await controller.createCourse(dto)).toEqual({ id: '1' });
    expect(service.adminCreate).toHaveBeenCalledWith(dto);
  });

  it('should list courses', async () => {
    service.list.mockResolvedValue([{ id: '1' }] as any);
    expect(await controller.listCourses({})).toEqual([{ id: '1' }]);
    expect(service.list).toHaveBeenCalledWith({});
  });

  it('should get course by id', async () => {
    service.findById.mockResolvedValue({ id: '1' } as any);
    expect(await controller.getCourse('1')).toEqual({ id: '1' });
    expect(service.findById).toHaveBeenCalledWith('1');
  });

  it('should update course', async () => {
    const dto: AdminUpdateCourseDTO = { title: 'Updated' } as any;
    service.adminUpdate.mockResolvedValue({ id: '1' } as any);
    expect(await controller.updateCourse('1', dto)).toEqual({ id: '1' });
    expect(service.adminUpdate).toHaveBeenCalledWith('1', dto);
  });

  it('should delete course', async () => {
    service.adminDelete.mockResolvedValue(undefined);
    await controller.deleteCourse('1');
    expect(service.adminDelete).toHaveBeenCalledWith('1');
  });
});

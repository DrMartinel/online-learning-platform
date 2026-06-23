import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDTO, UpdateCourseDTO, CourseResponseDTO, ListCoursesFilterDTO } from '../dto/course.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OrganizeExamDTO, CourseExamResponseDTO } from '../dto/course-exam.dto';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @Auth('action:course:create')
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course successfully created', type: CourseResponseDTO })
  async createCourse(@CurrentUser() user: any, @Body() dto: CreateCourseDTO): Promise<CourseResponseDTO> {
    return this.courseService.create(user.id, dto);
  }

  @Get()
  @Auth('action:course:list')
  @ApiOperation({ summary: 'List courses' })
  @ApiQuery({ name: 'instructorId', required: false })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of courses', type: [CourseResponseDTO] })
  async listCourses(@Query() filter: ListCoursesFilterDTO): Promise<CourseResponseDTO[]> {
    return this.courseService.list(filter);
  }

  @Get('enrolled/me') 
  @Auth()
  @ApiOperation({ summary: 'Lấy danh sách các khóa học user đã đăng ký/mua' })
  @ApiResponse({ status: 200, description: 'Danh sách khóa học' })
  async getMyEnrolledCourses(@CurrentUser() user: any): Promise<CourseResponseDTO[]> {
    return this.courseService.getEnrolledCourses(user.id);
  }

  @Get(':id')
  @Auth('action:course:read')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'The course', type: CourseResponseDTO })
  async getCourse(@Param('id') id: string): Promise<CourseResponseDTO> {
    return this.courseService.findById(id);
  }

  @Put(':id')
  @Auth('action:course:update')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({ status: 200, description: 'Course successfully updated', type: CourseResponseDTO })
  async updateCourse(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateCourseDTO): Promise<CourseResponseDTO> {
    return this.courseService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Auth('action:course:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 204, description: 'Course successfully deleted' })
  async deleteCourse(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    return this.courseService.delete(id, user.id);
  }

  @Post(':id/enroll')
  @Auth() //Bắt buộc user phải đăng nhập mới được gọi API này
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký khóa học miễn phí' })
  @ApiResponse({ status: 200, description: 'Đăng ký thành công' })
  async enrollFreeCourse(@Param('id') id: string, @CurrentUser() user: any): Promise<{ message: string }> {
    await this.courseService.enrollFreeCourse(id, user.id);
    return { message: 'Đăng ký khóa học thành công' };
  }

  @Get(':id/check-enrollment')
  @Auth()
  @ApiOperation({ summary: 'Kiểm tra quyền sở hữu khóa học' })
  async checkEnrollment(@Param('id') id: string, @CurrentUser() user: any): Promise<{ isEnrolled: boolean }> {
    const isEnrolled = await this.courseService.checkEnrollment(id, user.id);
    return { isEnrolled };
  }

  @Post(':id/organize-exam')
  @Auth('action:course:update')
  @ApiOperation({ summary: 'Organize exams for a course' })
  @ApiResponse({ status: 200, description: 'Exams organized successfully' })
  async organizeExam(@Param('id') courseId: string, @CurrentUser() user: any, @Body() dto: OrganizeExamDTO): Promise<{ message: string }> {
    await this.courseService.organizeExam(courseId, dto.examIds, user.id);
    return { message: 'Exams organized successfully' };
  }

  @Get(':id/exams')
  @Auth('action:course:read')
  @ApiOperation({ summary: 'Get exams for a course' })
  @ApiResponse({ status: 200, description: 'List of exams', type: [CourseExamResponseDTO] })
  async getCourseExams(@Param('id') courseId: string): Promise<CourseExamResponseDTO[]> {
    const exams = await this.courseService.getCourseExams(courseId);
    return exams as any; // Assuming repository returns matching shape
  }
}

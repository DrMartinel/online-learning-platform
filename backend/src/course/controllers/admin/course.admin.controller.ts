import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CourseService } from '../../services/course.service';
import { CourseResponseDTO, ListCoursesFilterDTO } from '../../dto/course.dto';
import { AdminCreateCourseDTO, AdminUpdateCourseDTO } from '../../dto/course-admin.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OperatorAuth } from '../../../iam/decorators/auth.decorator';

@ApiTags('admin/courses')
@ApiBearerAuth()
@Controller('admin/courses')
export class CourseAdminController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @OperatorAuth('action:admin:course:create')
  @ApiOperation({ summary: 'Admin: Create a new course' })
  @ApiResponse({ status: 201, type: CourseResponseDTO })
  async createCourse(@Body() dto: AdminCreateCourseDTO): Promise<CourseResponseDTO> {
    return this.courseService.adminCreate(dto);
  }

  @Get()
  @OperatorAuth('action:admin:course:list')
  @ApiOperation({ summary: 'Admin: List courses' })
  @ApiQuery({ name: 'instructorId', required: false })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [CourseResponseDTO] })
  async listCourses(@Query() filter: ListCoursesFilterDTO): Promise<CourseResponseDTO[]> {
    return this.courseService.list(filter);
  }

  @Get(':id')
  @OperatorAuth('action:admin:course:read')
  @ApiOperation({ summary: 'Admin: Get course by ID' })
  @ApiResponse({ status: 200, type: CourseResponseDTO })
  async getCourse(@Param('id') id: string): Promise<CourseResponseDTO> {
    return this.courseService.findById(id);
  }

  @Put(':id')
  @OperatorAuth('action:admin:course:update')
  @ApiOperation({ summary: 'Admin: Update any course' })
  @ApiResponse({ status: 200, type: CourseResponseDTO })
  async updateCourse(@Param('id') id: string, @Body() dto: AdminUpdateCourseDTO): Promise<CourseResponseDTO> {
    return this.courseService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @OperatorAuth('action:admin:course:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: Delete any course' })
  @ApiResponse({ status: 204 })
  async deleteCourse(@Param('id') id: string): Promise<void> {
    return this.courseService.adminDelete(id);
  }
}

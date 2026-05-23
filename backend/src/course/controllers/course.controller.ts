import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDTO, UpdateCourseDTO, CourseResponseDTO, ListCoursesFilterDTO } from '../dto/course.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course successfully created', type: CourseResponseDTO })
  async createCourse(@Headers('x-user-id') instructorId: string, @Body() dto: CreateCourseDTO): Promise<CourseResponseDTO> {
    // In a real app, instructorId would come from an AuthGuard setting req.user
    return this.courseService.create(instructorId || 'mock-instructor-id', dto);
  }

  @Get()
  @ApiOperation({ summary: 'List courses' })
  @ApiQuery({ name: 'instructorId', required: false })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of courses', type: [CourseResponseDTO] })
  async listCourses(@Query() filter: ListCoursesFilterDTO): Promise<CourseResponseDTO[]> {
    return this.courseService.list(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'The course', type: CourseResponseDTO })
  async getCourse(@Param('id') id: string): Promise<CourseResponseDTO> {
    return this.courseService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({ status: 200, description: 'Course successfully updated', type: CourseResponseDTO })
  async updateCourse(@Param('id') id: string, @Headers('x-user-id') instructorId: string, @Body() dto: UpdateCourseDTO): Promise<CourseResponseDTO> {
    return this.courseService.update(id, dto, instructorId || 'mock-instructor-id');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({ status: 204, description: 'Course successfully deleted' })
  async deleteCourse(@Param('id') id: string, @Headers('x-user-id') instructorId: string): Promise<void> {
    return this.courseService.delete(id, instructorId || 'mock-instructor-id');
  }
}

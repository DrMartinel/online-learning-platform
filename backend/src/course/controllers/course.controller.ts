import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, Headers } from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDTO, UpdateCourseDTO, CourseResponseDTO, ListCoursesFilterDTO } from '../dto/course.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
}

import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonService } from '../services/lesson.service';
import { CreateLessonDTO, UpdateLessonDTO, LessonResponseDTO } from '../dto/lesson.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';

@ApiTags('lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @Auth('action:lesson:create')
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiResponse({ status: 201, description: 'Lesson successfully created', type: LessonResponseDTO })
  async createLesson(@Body() dto: CreateLessonDTO): Promise<LessonResponseDTO> {
    return this.lessonService.create(dto);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List lessons for a course' })
  @ApiQuery({ name: 'courseId', required: true })
  @ApiQuery({ name: 'publishedOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of lessons', type: [LessonResponseDTO] })
  async listLessons(
    @Query('courseId') courseId: string,
    @Query('publishedOnly') publishedOnly?: boolean,
  ): Promise<LessonResponseDTO[]> {
    return this.lessonService.findByCourseId(courseId, publishedOnly);
  }

  @Get('course/:courseId')
  @Auth()
  @ApiOperation({ summary: 'List lessons for a course (student view)' })
  @ApiResponse({ status: 200, description: 'List of lessons for the course', type: [LessonResponseDTO] })
  async getCourseLessons(@Param('courseId') courseId: string): Promise<LessonResponseDTO[]> {
    return this.lessonService.findByCourseId(courseId, false);
  }

  @Get('detail/:id')
  @Auth()
  @ApiOperation({ summary: 'Get lesson by ID (student view)' })
  @ApiResponse({ status: 200, description: 'The lesson', type: LessonResponseDTO })
  async getLessonDetail(@Param('id') id: string): Promise<LessonResponseDTO> {
    return this.lessonService.findById(id);
  }

  @Get(':id')
  @Auth('action:lesson:read')
  @ApiOperation({ summary: 'Get lesson by ID (admin view)' })
  @ApiResponse({ status: 200, description: 'The lesson', type: LessonResponseDTO })
  async getLesson(@Param('id') id: string): Promise<LessonResponseDTO> {
    return this.lessonService.findById(id);
  }

  @Put(':id')
  @Auth('action:lesson:update')
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiResponse({ status: 200, description: 'Lesson successfully updated', type: LessonResponseDTO })
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDTO): Promise<LessonResponseDTO> {
    return this.lessonService.update(id, dto);
  }

  @Delete(':id')
  @Auth('action:lesson:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiResponse({ status: 204, description: 'Lesson successfully deleted' })
  async deleteLesson(@Param('id') id: string): Promise<void> {
    return this.lessonService.delete(id);
  }
}

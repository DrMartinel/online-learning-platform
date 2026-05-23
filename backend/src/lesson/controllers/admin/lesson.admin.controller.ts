import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonService } from '../../services/lesson.service';
import { CreateLessonDTO, UpdateLessonDTO, LessonResponseDTO } from '../../dto/lesson.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OperatorAuth } from '../../../iam/decorators/auth.decorator';

@ApiTags('admin/lessons')
@ApiBearerAuth()
@Controller('admin/lessons')
export class LessonAdminController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @OperatorAuth('action:admin:lesson:create')
  @ApiOperation({ summary: 'Admin: Create a new lesson' })
  @ApiResponse({ status: 201, type: LessonResponseDTO })
  async createLesson(@Body() dto: CreateLessonDTO): Promise<LessonResponseDTO> {
    return this.lessonService.create(dto);
  }

  @Get()
  @OperatorAuth('action:admin:lesson:list')
  @ApiOperation({ summary: 'Admin: List lessons for a course' })
  @ApiQuery({ name: 'courseId', required: true })
  @ApiQuery({ name: 'publishedOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [LessonResponseDTO] })
  async listLessons(
    @Query('courseId') courseId: string,
    @Query('publishedOnly') publishedOnly?: boolean,
  ): Promise<LessonResponseDTO[]> {
    return this.lessonService.findByCourseId(courseId, publishedOnly);
  }

  @Get(':id')
  @OperatorAuth('action:admin:lesson:read')
  @ApiOperation({ summary: 'Admin: Get lesson by ID' })
  @ApiResponse({ status: 200, type: LessonResponseDTO })
  async getLesson(@Param('id') id: string): Promise<LessonResponseDTO> {
    return this.lessonService.findById(id);
  }

  @Put(':id')
  @OperatorAuth('action:admin:lesson:update')
  @ApiOperation({ summary: 'Admin: Update a lesson' })
  @ApiResponse({ status: 200, type: LessonResponseDTO })
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDTO): Promise<LessonResponseDTO> {
    return this.lessonService.update(id, dto);
  }

  @Delete(':id')
  @OperatorAuth('action:admin:lesson:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: Delete a lesson' })
  @ApiResponse({ status: 204 })
  async deleteLesson(@Param('id') id: string): Promise<void> {
    return this.lessonService.delete(id);
  }
}

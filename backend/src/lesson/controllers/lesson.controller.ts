import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonService } from '../services/lesson.service';
import { CreateLessonDTO, UpdateLessonDTO, LessonResponseDTO } from '../dto/lesson.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

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
  @Auth('action:lesson:list')
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

  @Get('chapter/:chapterId')
  @Auth()
  @ApiOperation({ summary: 'Lấy danh sách bài học của chương' })
  @ApiResponse({ status: 200, type: [LessonResponseDTO] })
  async findByChapterId(@Param('chapterId') chapterId: string): Promise<LessonResponseDTO[]> {
    return this.lessonService.findByChapterId(chapterId);
  }

  @Get(':id')
  @Auth('action:lesson:read') // Bắt buộc user phải có token
  @ApiOperation({ summary: 'Get lesson by ID (With Paywall)' })
  @ApiResponse({ status: 200, description: 'The lesson', type: LessonResponseDTO })
  async getLesson(
    @CurrentUser() user: any, // Lấy thông tin user từ JWT Token
    @Param('id') id: string
  ): Promise<LessonResponseDTO> {
    // Gọi hàm mới getLessonDetail và truyền cả user.id vào
    return this.lessonService.getLessonDetail(id, user.id);
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

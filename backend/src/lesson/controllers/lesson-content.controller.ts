import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { LessonContentService } from '../services/lesson-content.service';
import { CreateLessonContentDTO, UpdateLessonContentDTO, LessonContentResponseDTO } from '../dto/lesson-content.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';

@ApiTags('lesson-contents')
@Controller('lessons/contents')
export class LessonContentController {
  constructor(private readonly contentService: LessonContentService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Tạo một học liệu mới cho bài học' })
  @ApiResponse({ status: 201, type: LessonContentResponseDTO })
  async create(@Body() dto: CreateLessonContentDTO): Promise<LessonContentResponseDTO> {
    return this.contentService.create(dto);
  }

  @Get('lesson/:lessonId')
  @Auth()
  @ApiOperation({ summary: 'Lấy toàn bộ học liệu của bài học' })
  @ApiResponse({ status: 200, type: [LessonContentResponseDTO] })
  async findByLessonId(@Param('lessonId') lessonId: string): Promise<LessonContentResponseDTO[]> {
    return this.contentService.findByLessonId(lessonId);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết học liệu theo ID' })
  @ApiResponse({ status: 200, type: LessonContentResponseDTO })
  async findById(@Param('id') id: string): Promise<LessonContentResponseDTO> {
    return this.contentService.findById(id);
  }

  @Put(':id')
  @Auth()
  @ApiOperation({ summary: 'Cập nhật thông tin học liệu' })
  @ApiResponse({ status: 200, type: LessonContentResponseDTO })
  async update(@Param('id') id: string, @Body() dto: UpdateLessonContentDTO): Promise<LessonContentResponseDTO> {
    return this.contentService.update(id, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa một học liệu' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.contentService.delete(id);
  }
}

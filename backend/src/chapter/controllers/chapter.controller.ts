import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChapterService } from '../services/chapter.service';
import { CreateChapterDTO, UpdateChapterDTO, ChapterResponseDTO } from '../dto/chapter.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';

@ApiTags('chapters')
@Controller('chapters')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Tạo một chương mới' })
  @ApiResponse({ status: 201, description: 'Chương được tạo thành công', type: ChapterResponseDTO })
  async create(@Body() dto: CreateChapterDTO): Promise<ChapterResponseDTO> {
    return this.chapterService.create(dto);
  }

  @Get('course/:courseId')
  @Auth()
  @ApiOperation({ summary: 'Lấy danh sách chương của khóa học' })
  @ApiResponse({ status: 200, type: [ChapterResponseDTO] })
  async findByCourseId(@Param('courseId') courseId: string): Promise<ChapterResponseDTO[]> {
    return this.chapterService.findByCourseId(courseId);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết chương theo ID' })
  @ApiResponse({ status: 200, type: ChapterResponseDTO })
  async findById(@Param('id') id: string): Promise<ChapterResponseDTO> {
    return this.chapterService.findById(id);
  }

  @Put(':id')
  @Auth()
  @ApiOperation({ summary: 'Cập nhật thông tin chương' })
  @ApiResponse({ status: 200, type: ChapterResponseDTO })
  async update(@Param('id') id: string, @Body() dto: UpdateChapterDTO): Promise<ChapterResponseDTO> {
    return this.chapterService.update(id, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa một chương' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    await this.chapterService.delete(id);
  }
}

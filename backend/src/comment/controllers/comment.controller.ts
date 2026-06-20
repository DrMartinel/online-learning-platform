import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { CommentService } from '../services/comment.service';
import { CreateCommentDTO, UpdateCommentDTO, CommentResponseDTO } from '../dto/comment.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @ApiResponse({ status: 201, description: 'Bình luận được tạo thành công', type: CommentResponseDTO })
  async create(@CurrentUser() user: any, @Body() dto: CreateCommentDTO): Promise<CommentResponseDTO> {
    if (!user) throw new UnauthorizedException();
    return this.commentService.create(user.id, dto);
  }

  @Get('lesson/:lessonId')
  @Auth()
  @ApiOperation({ summary: 'Lấy danh sách bình luận của bài học' })
  @ApiResponse({ status: 200, type: [CommentResponseDTO] })
  async findByLessonId(@Param('lessonId') lessonId: string): Promise<CommentResponseDTO[]> {
    return this.commentService.findByLessonId(lessonId);
  }

  @Put(':id')
  @Auth()
  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @ApiResponse({ status: 200, type: CommentResponseDTO })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCommentDTO
  ): Promise<CommentResponseDTO> {
    if (!user) throw new UnauthorizedException();
    return this.commentService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    if (!user) throw new UnauthorizedException();
    await this.commentService.delete(id, user.id);
  }
}

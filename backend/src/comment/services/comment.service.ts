import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ICommentRepository } from '../repositories/ICommentRepository';
import { Comment } from '../entities/Comment';
import { CreateCommentDTO, UpdateCommentDTO, CommentResponseDTO } from '../dto/comment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CommentService {
  constructor(
    @Inject('ICommentRepository')
    private readonly commentRepo: ICommentRepository,
  ) {}

  async create(userId: string, dto: CreateCommentDTO): Promise<CommentResponseDTO> {
    const comment = new Comment(
      randomUUID(),
      dto.lessonId,
      userId,
      dto.content,
      dto.parentId || null,
      new Date()
    );
    await this.commentRepo.create(comment);
    return {
      id: comment.id,
      lessonId: comment.lessonId,
      userId: comment.userId,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
    };
  }

  async findByLessonId(lessonId: string): Promise<CommentResponseDTO[]> {
    const comments = await this.commentRepo.findByLessonId(lessonId);
    return comments.map(c => ({
      id: c.id,
      lessonId: c.lessonId,
      userId: c.userId,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
      userFullName: c.userFullName,
      userAvatarUrl: c.userAvatarUrl,
    }));
  }

  async update(id: string, userId: string, dto: UpdateCommentDTO): Promise<CommentResponseDTO> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bình luận này');
    }

    comment.updateContent(dto.content);
    await this.commentRepo.update(comment);

    return {
      id: comment.id,
      lessonId: comment.lessonId,
      userId: comment.userId,
      content: comment.content,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    await this.commentRepo.delete(id);
  }
}

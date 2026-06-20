import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ILessonContentRepository } from '../repositories/ILessonContentRepository';
import { LessonContent } from '../entities/LessonContent';
import { CreateLessonContentDTO, UpdateLessonContentDTO, LessonContentResponseDTO } from '../dto/lesson-content.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LessonContentService {
  constructor(
    @Inject('ILessonContentRepository')
    private readonly contentRepo: ILessonContentRepository,
  ) {}

  async create(dto: CreateLessonContentDTO): Promise<LessonContentResponseDTO> {
    const content = new LessonContent(
      randomUUID(),
      dto.lessonId,
      dto.type,
      dto.title,
      dto.url,
      dto.durationMinutes ?? null,
      dto.orderIndex ?? 0,
      new Date()
    );
    await this.contentRepo.create(content);
    return this.mapToResponse(content);
  }

  async findById(id: string): Promise<LessonContentResponseDTO> {
    const content = await this.contentRepo.findById(id);
    if (!content) {
      throw new NotFoundException(`Lesson content with ID ${id} not found`);
    }
    return this.mapToResponse(content);
  }

  async findByLessonId(lessonId: string): Promise<LessonContentResponseDTO[]> {
    const contents = await this.contentRepo.findByLessonId(lessonId);
    return contents.map(c => this.mapToResponse(c));
  }

  async update(id: string, dto: UpdateLessonContentDTO): Promise<LessonContentResponseDTO> {
    const content = await this.contentRepo.findById(id);
    if (!content) {
      throw new NotFoundException(`Lesson content with ID ${id} not found`);
    }

    content.updateDetails(
      dto.title,
      dto.url,
      dto.durationMinutes,
      dto.orderIndex
    );

    await this.contentRepo.update(content);
    return this.mapToResponse(content);
  }

  async delete(id: string): Promise<void> {
    const content = await this.contentRepo.findById(id);
    if (!content) {
      throw new NotFoundException(`Lesson content with ID ${id} not found`);
    }
    await this.contentRepo.delete(id);
  }

  private mapToResponse(content: LessonContent): LessonContentResponseDTO {
    return {
      id: content.id,
      lessonId: content.lessonId,
      type: content.type,
      title: content.title,
      url: content.url,
      durationMinutes: content.durationMinutes,
      orderIndex: content.orderIndex,
      createdAt: content.createdAt,
    };
  }
}

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IChapterRepository } from '../repositories/IChapterRepository';
import { Chapter } from '../entities/Chapter';
import { CreateChapterDTO, UpdateChapterDTO, ChapterResponseDTO } from '../dto/chapter.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ChapterService {
  constructor(
    @Inject('IChapterRepository')
    private readonly chapterRepo: IChapterRepository,
  ) {}

  async create(dto: CreateChapterDTO): Promise<ChapterResponseDTO> {
    const chapter = new Chapter(
      randomUUID(),
      dto.courseId,
      dto.title,
      dto.orderIndex ?? 0,
      new Date()
    );
    await this.chapterRepo.create(chapter);
    return this.mapToResponse(chapter);
  }

  async findById(id: string): Promise<ChapterResponseDTO> {
    const chapter = await this.chapterRepo.findById(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }
    return this.mapToResponse(chapter);
  }

  async findByCourseId(courseId: string): Promise<ChapterResponseDTO[]> {
    const chapters = await this.chapterRepo.findByCourseId(courseId);
    return chapters.map(c => this.mapToResponse(c));
  }

  async update(id: string, dto: UpdateChapterDTO): Promise<ChapterResponseDTO> {
    const chapter = await this.chapterRepo.findById(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }

    if (dto.title !== undefined) chapter.updateTitle(dto.title);
    if (dto.orderIndex !== undefined) chapter.updateOrderIndex(dto.orderIndex);

    await this.chapterRepo.update(chapter);
    return this.mapToResponse(chapter);
  }

  async delete(id: string): Promise<void> {
    const chapter = await this.chapterRepo.findById(id);
    if (!chapter) {
      throw new NotFoundException(`Chapter with ID ${id} not found`);
    }
    await this.chapterRepo.delete(id);
  }

  private mapToResponse(chapter: Chapter): ChapterResponseDTO {
    return {
      id: chapter.id,
      courseId: chapter.courseId,
      title: chapter.title,
      orderIndex: chapter.orderIndex,
      createdAt: chapter.createdAt,
    };
  }
}

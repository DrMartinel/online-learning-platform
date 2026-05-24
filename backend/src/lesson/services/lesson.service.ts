import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LessonRepository } from '../repositories/Ilesson.repository';
import { Lesson } from '../entities/Lesson';
import { CreateLessonDTO, UpdateLessonDTO, LessonResponseDTO } from '../dto/lesson.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LessonService {
  constructor(
    @Inject('ILessonRepository')
    private readonly lessonRepo: LessonRepository,
  ) {}

  async create(dto: CreateLessonDTO): Promise<LessonResponseDTO> {
    const lesson = await this.lessonRepo.create({
      courseId: dto.courseId,
      chapterId: dto.chapterId || null,
      title: dto.title,
      content: dto.content || null,
      videoUrl: dto.videoUrl || null,
      orderIndex: dto.orderIndex,
    });
    return this.mapToResponse(lesson);
  }

  async findById(id: string): Promise<LessonResponseDTO> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.mapToResponse(lesson);
  }

  async findByCourseId(courseId: string, publishedOnly?: boolean): Promise<LessonResponseDTO[]> {
    const lessons = await this.lessonRepo.findByCourseId(courseId);
    // Ignore publishedOnly for now since Lesson doesn't have it
    return lessons.map((l) => this.mapToResponse(l));
  }

  async update(id: string, dto: UpdateLessonDTO): Promise<LessonResponseDTO> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const updated = await this.lessonRepo.update(id, {
      chapterId: dto.chapterId !== undefined ? dto.chapterId : lesson.chapterId,
      title: dto.title !== undefined ? dto.title : lesson.title,
      content: dto.content !== undefined ? dto.content : lesson.content,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : lesson.videoUrl,
      orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : lesson.orderIndex,
    });
    
    if (!updated) throw new NotFoundException('Lesson not found');
    return this.mapToResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const lesson = await this.lessonRepo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepo.delete(id);
  }

  private mapToResponse(lesson: Lesson): LessonResponseDTO {
    return {
      id: lesson.id,
      courseId: lesson.courseId,
      chapterId: lesson.chapterId || undefined,
      title: lesson.title,
      content: lesson.content || undefined,
      videoUrl: lesson.videoUrl || undefined,
      orderIndex: lesson.orderIndex,
      isPublished: true, // Placeholder since DB doesn't have it
      createdAt: new Date(lesson.createdAt),
      media: lesson.media,
    };
  }
}

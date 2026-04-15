import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { CreateLessonRequestDTO, LessonDTO } from '../../dtos/LessonDTOs';

export class CreateLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(dto: CreateLessonRequestDTO): Promise<LessonDTO> {
    const lesson = await this.lessonRepository.create({
      courseId: dto.courseId,
      title: dto.title,
      videoUrl: dto.videoUrl ?? null,
      content: dto.content ?? null,
      orderIndex: dto.orderIndex,
    });
    return lesson as LessonDTO;
  }
}

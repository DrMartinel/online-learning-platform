import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { UpdateLessonRequestDTO, LessonDTO } from '../../dtos/LessonDTOs';

export class UpdateLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(id: string, dto: UpdateLessonRequestDTO): Promise<LessonDTO> {
    if (!id) {
      throw new Error('Lesson ID is required');
    }

    const lesson = await this.lessonRepository.update(id, {
      title: dto.title,
      videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : undefined,
      content: dto.content !== undefined ? dto.content : undefined,
      orderIndex: dto.orderIndex,
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    return lesson as LessonDTO;
  }
}

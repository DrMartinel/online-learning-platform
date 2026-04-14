import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { LessonDTO } from '../../dtos/LessonDTOs';

export class GetLessonByIdUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(id: string): Promise<LessonDTO> {
    if (!id) {
      throw new Error('Lesson ID is required');
    }

    const lesson = await this.lessonRepository.findById(id);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    return lesson as LessonDTO;
  }
}

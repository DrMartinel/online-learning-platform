import { LessonRepository } from '../../../domain/repositories/LessonRepository';

export class DeleteLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('Lesson ID is required');
    }

    await this.lessonRepository.delete(id);
  }
}

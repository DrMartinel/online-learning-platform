import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { LessonDTO } from '../../dtos/LessonDTOs';

export class GetLessonsByCourseUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(courseId: string): Promise<LessonDTO[]> {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const lessons = await this.lessonRepository.findByCourseId(courseId);
    return lessons as LessonDTO[];
  }
}

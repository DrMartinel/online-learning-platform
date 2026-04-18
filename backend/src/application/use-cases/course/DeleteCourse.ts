import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { CourseNotFoundError } from '../../../domain/errors/CourseErrors';

export class DeleteCourseUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  public async execute(id: string): Promise<void> {
    // Verify course exists before deletion
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new CourseNotFoundError(id);
    }

    // Delete the course
    await this.courseRepository.delete(id);
  }
}

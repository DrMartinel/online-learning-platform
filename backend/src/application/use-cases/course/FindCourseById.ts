import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { CourseResponseDTO } from '../../dtos/CourseDTOs';
import { CourseNotFoundError } from '../../../domain/errors/CourseErrors';

export class FindCourseByIdUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  public async execute(id: string): Promise<CourseResponseDTO> {
    const course = await this.courseRepository.findById(id);

    if (!course) {
      throw new CourseNotFoundError(id);
    }

    return {
      id: course.id,
      instructorId: course.instructorId,
      title: course.title,
      description: course.description || undefined,
      thumbnailUrl: course.thumbnailUrl || undefined,
      isPublished: course.isPublished,
      createdAt: course.createdAt
    };
  }
}

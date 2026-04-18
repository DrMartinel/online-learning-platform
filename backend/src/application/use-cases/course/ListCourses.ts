import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { ListCoursesFilterDTO, CourseResponseDTO } from '../../dtos/CourseDTOs';

export class ListCoursesUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  public async execute(filter?: ListCoursesFilterDTO): Promise<CourseResponseDTO[]> {
    const courses = await this.courseRepository.findAll(filter);

    return courses.map(course => ({
      id: course.id,
      instructorId: course.instructorId,
      title: course.title,
      description: course.description || undefined,
      thumbnailUrl: course.thumbnailUrl || undefined,
      isPublished: course.isPublished,
      createdAt: course.createdAt
    }));
  }
}

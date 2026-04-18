import { randomUUID } from 'node:crypto';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { Course } from '../../../domain/entities/Course';
import { CreateCourseDTO, CourseResponseDTO } from '../../dtos/CourseDTOs';
import { CourseValidationError } from '../../../domain/errors/CourseErrors';

export class CreateCourseUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  public async execute(instructorId: string, dto: CreateCourseDTO): Promise<CourseResponseDTO> {
    // Validate input
    if (!dto.title || dto.title.trim().length === 0) {
      throw new CourseValidationError('Title is required');
    }

    if (dto.title.trim().length < 3) {
      throw new CourseValidationError('Title must be at least 3 characters long');
    }

    // Create course entity
    const course = new Course(
      randomUUID(),
      instructorId,
      dto.title.trim(),
      dto.description?.trim() || null,
      dto.thumbnailUrl || null,
      false,
      new Date()
    );

    // Save to repository
    const createdCourse = await this.courseRepository.create(course);

    return this.mapToDTO(createdCourse);
  }

  private mapToDTO(course: Course): CourseResponseDTO {
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

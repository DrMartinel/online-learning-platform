import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { UpdateCourseDTO, CourseResponseDTO } from '../../dtos/CourseDTOs';
import { CourseNotFoundError, CourseValidationError } from '../../../domain/errors/CourseErrors';

export class UpdateCourseUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  public async execute(dto: UpdateCourseDTO): Promise<CourseResponseDTO> {
    // Find existing course
    const course = await this.courseRepository.findById(dto.id);
    if (!course) {
      throw new CourseNotFoundError(dto.id);
    }

    // Update title if provided
    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        throw new CourseValidationError('Title cannot be empty');
      }
      if (dto.title.trim().length < 3) {
        throw new CourseValidationError('Title must be at least 3 characters long');
      }
      course.updateTitle(dto.title.trim());
    }

    // Update other fields
    if (dto.description !== undefined) {
      course.description = dto.description.trim() || null;
    }

    if (dto.thumbnailUrl !== undefined) {
      course.thumbnailUrl = dto.thumbnailUrl || null;
    }

    if (dto.isPublished !== undefined) {
      course.isPublished = dto.isPublished;
    }

    // Save updated course
    const updatedCourse = await this.courseRepository.update(course);

    return {
      id: updatedCourse.id,
      instructorId: updatedCourse.instructorId,
      title: updatedCourse.title,
      description: updatedCourse.description || undefined,
      thumbnailUrl: updatedCourse.thumbnailUrl || undefined,
      isPublished: updatedCourse.isPublished,
      createdAt: updatedCourse.createdAt
    };
  }
}

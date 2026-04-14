"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCourseUseCase = void 0;
const CourseErrors_1 = require("../../../domain/errors/CourseErrors");
class UpdateCourseUseCase {
    courseRepository;
    constructor(courseRepository) {
        this.courseRepository = courseRepository;
    }
    async execute(dto) {
        // Find existing course
        const course = await this.courseRepository.findById(dto.id);
        if (!course) {
            throw new CourseErrors_1.CourseNotFoundError(dto.id);
        }
        // Update title if provided
        if (dto.title !== undefined) {
            if (dto.title.trim().length === 0) {
                throw new CourseErrors_1.CourseValidationError('Title cannot be empty');
            }
            if (dto.title.trim().length < 3) {
                throw new CourseErrors_1.CourseValidationError('Title must be at least 3 characters long');
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
exports.UpdateCourseUseCase = UpdateCourseUseCase;

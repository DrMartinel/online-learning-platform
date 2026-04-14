"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindCourseByIdUseCase = void 0;
const CourseErrors_1 = require("../../../domain/errors/CourseErrors");
class FindCourseByIdUseCase {
    courseRepository;
    constructor(courseRepository) {
        this.courseRepository = courseRepository;
    }
    async execute(id) {
        const course = await this.courseRepository.findById(id);
        if (!course) {
            throw new CourseErrors_1.CourseNotFoundError(id);
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
exports.FindCourseByIdUseCase = FindCourseByIdUseCase;

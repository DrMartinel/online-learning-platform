"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListCoursesUseCase = void 0;
class ListCoursesUseCase {
    courseRepository;
    constructor(courseRepository) {
        this.courseRepository = courseRepository;
    }
    async execute(filter) {
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
exports.ListCoursesUseCase = ListCoursesUseCase;

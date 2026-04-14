"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCourseUseCase = void 0;
const CourseErrors_1 = require("../../../domain/errors/CourseErrors");
class DeleteCourseUseCase {
    courseRepository;
    constructor(courseRepository) {
        this.courseRepository = courseRepository;
    }
    async execute(id) {
        // Verify course exists before deletion
        const course = await this.courseRepository.findById(id);
        if (!course) {
            throw new CourseErrors_1.CourseNotFoundError(id);
        }
        // Delete the course
        await this.courseRepository.delete(id);
    }
}
exports.DeleteCourseUseCase = DeleteCourseUseCase;

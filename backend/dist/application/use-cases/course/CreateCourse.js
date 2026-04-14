"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCourseUseCase = void 0;
const uuid_1 = require("uuid");
const Course_1 = require("../../../domain/entities/Course");
const CourseErrors_1 = require("../../../domain/errors/CourseErrors");
class CreateCourseUseCase {
    courseRepository;
    constructor(courseRepository) {
        this.courseRepository = courseRepository;
    }
    async execute(instructorId, dto) {
        // Validate input
        if (!dto.title || dto.title.trim().length === 0) {
            throw new CourseErrors_1.CourseValidationError('Title is required');
        }
        if (dto.title.trim().length < 3) {
            throw new CourseErrors_1.CourseValidationError('Title must be at least 3 characters long');
        }
        // Create course entity
        const course = new Course_1.Course((0, uuid_1.v4)(), instructorId, dto.title.trim(), dto.description?.trim() || null, dto.thumbnailUrl || null, false, new Date());
        // Save to repository
        const createdCourse = await this.courseRepository.create(course);
        return this.mapToDTO(createdCourse);
    }
    mapToDTO(course) {
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
exports.CreateCourseUseCase = CreateCourseUseCase;

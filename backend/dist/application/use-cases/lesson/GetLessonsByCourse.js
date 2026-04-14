"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLessonsByCourseUseCase = void 0;
class GetLessonsByCourseUseCase {
    lessonRepository;
    constructor(lessonRepository) {
        this.lessonRepository = lessonRepository;
    }
    async execute(courseId) {
        if (!courseId) {
            throw new Error('Course ID is required');
        }
        const lessons = await this.lessonRepository.findByCourseId(courseId);
        return lessons;
    }
}
exports.GetLessonsByCourseUseCase = GetLessonsByCourseUseCase;

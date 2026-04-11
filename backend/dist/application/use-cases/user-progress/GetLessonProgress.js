"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLessonProgressUseCase = void 0;
class GetLessonProgressUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, lessonId) {
        return this.repository.findByUserAndLesson(userId, lessonId);
    }
}
exports.GetLessonProgressUseCase = GetLessonProgressUseCase;

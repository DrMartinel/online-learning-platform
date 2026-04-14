"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLessonByIdUseCase = void 0;
class GetLessonByIdUseCase {
    lessonRepository;
    constructor(lessonRepository) {
        this.lessonRepository = lessonRepository;
    }
    async execute(id) {
        if (!id) {
            throw new Error('Lesson ID is required');
        }
        const lesson = await this.lessonRepository.findById(id);
        if (!lesson) {
            throw new Error('Lesson not found');
        }
        return lesson;
    }
}
exports.GetLessonByIdUseCase = GetLessonByIdUseCase;

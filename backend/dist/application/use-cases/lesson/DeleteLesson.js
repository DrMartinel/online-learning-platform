"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteLessonUseCase = void 0;
class DeleteLessonUseCase {
    lessonRepository;
    constructor(lessonRepository) {
        this.lessonRepository = lessonRepository;
    }
    async execute(id) {
        if (!id) {
            throw new Error('Lesson ID is required');
        }
        await this.lessonRepository.delete(id);
    }
}
exports.DeleteLessonUseCase = DeleteLessonUseCase;

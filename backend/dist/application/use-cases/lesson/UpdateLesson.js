"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLessonUseCase = void 0;
class UpdateLessonUseCase {
    lessonRepository;
    constructor(lessonRepository) {
        this.lessonRepository = lessonRepository;
    }
    async execute(id, dto) {
        if (!id) {
            throw new Error('Lesson ID is required');
        }
        const lesson = await this.lessonRepository.update(id, {
            title: dto.title,
            videoUrl: dto.videoUrl !== undefined ? dto.videoUrl : undefined,
            content: dto.content !== undefined ? dto.content : undefined,
            orderIndex: dto.orderIndex,
        });
        if (!lesson) {
            throw new Error('Lesson not found');
        }
        return lesson;
    }
}
exports.UpdateLessonUseCase = UpdateLessonUseCase;

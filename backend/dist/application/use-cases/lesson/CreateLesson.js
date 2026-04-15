"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLessonUseCase = void 0;
class CreateLessonUseCase {
    lessonRepository;
    constructor(lessonRepository) {
        this.lessonRepository = lessonRepository;
    }
    async execute(dto) {
        const lesson = await this.lessonRepository.create({
            courseId: dto.courseId,
            title: dto.title,
            videoUrl: dto.videoUrl ?? null,
            content: dto.content ?? null,
            orderIndex: dto.orderIndex,
        });
        return lesson;
    }
}
exports.CreateLessonUseCase = CreateLessonUseCase;

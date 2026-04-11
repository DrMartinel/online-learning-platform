"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserProgressUseCase = void 0;
class CreateUserProgressUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, dto) {
        const existing = await this.repository.findByUserAndLesson(userId, dto.lessonId);
        if (existing) {
            return this.repository.update(existing.id, { completed: dto.completed });
        }
        return this.repository.create(userId, dto);
    }
}
exports.CreateUserProgressUseCase = CreateUserProgressUseCase;

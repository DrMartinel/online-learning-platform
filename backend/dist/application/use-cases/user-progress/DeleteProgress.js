"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteProgressUseCase = void 0;
class DeleteProgressUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Progress record with ID ${id} not found`);
        }
        await this.repository.delete(id);
    }
}
exports.DeleteProgressUseCase = DeleteProgressUseCase;

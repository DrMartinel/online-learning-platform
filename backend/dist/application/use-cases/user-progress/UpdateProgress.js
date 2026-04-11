"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProgressUseCase = void 0;
class UpdateProgressUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id, dto) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new Error(`Progress record with ID ${id} not found`);
        }
        return this.repository.update(id, dto);
    }
}
exports.UpdateProgressUseCase = UpdateProgressUseCase;

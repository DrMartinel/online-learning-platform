"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserProfileUseCase = void 0;
const UserErrors_1 = require("../../../domain/errors/UserErrors");
class UpdateUserProfileUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(dto) {
        if (!dto.id) {
            throw new Error('User ID is required');
        }
        const user = await this.userRepository.findById(dto.id);
        if (!user) {
            throw new UserErrors_1.UserNotFoundError(dto.id);
        }
        if (dto.fullName !== undefined) {
            user.updateFullName(dto.fullName);
        }
        await this.userRepository.update(user);
        return {
            id: user.id,
            fullName: user.fullName,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
        };
    }
}
exports.UpdateUserProfileUseCase = UpdateUserProfileUseCase;

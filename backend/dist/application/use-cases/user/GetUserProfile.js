"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUserProfileUseCase = void 0;
const UserErrors_1 = require("../../../domain/errors/UserErrors");
class GetUserProfileUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserErrors_1.UserNotFoundError(userId);
        }
        return {
            id: user.id,
            fullName: user.fullName,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
        };
    }
}
exports.GetUserProfileUseCase = GetUserProfileUseCase;

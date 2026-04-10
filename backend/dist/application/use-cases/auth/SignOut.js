"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignOutUseCase = void 0;
class SignOutUseCase {
    authRepository;
    constructor(authRepository) {
        this.authRepository = authRepository;
    }
    async execute() {
        await this.authRepository.signOut();
    }
}
exports.SignOutUseCase = SignOutUseCase;

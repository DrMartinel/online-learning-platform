"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignUpUseCase = void 0;
const AuthErrors_1 = require("../../../domain/errors/AuthErrors");
class SignUpUseCase {
    authRepository;
    constructor(authRepository) {
        this.authRepository = authRepository;
    }
    async execute(dto) {
        if (!dto.email) {
            throw new AuthErrors_1.AuthenticationError('Email is required for sign up');
        }
        if (!dto.fullName || dto.fullName.trim().length === 0) {
            throw new AuthErrors_1.AuthenticationError('Full name is required for sign up');
        }
        const session = await this.authRepository.signUp({
            email: dto.email,
            password: dto.password,
            fullName: dto.fullName
        });
        return {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            userId: session.userId,
            role: session.role,
            expiresAt: session.expiresAt
        };
    }
}
exports.SignUpUseCase = SignUpUseCase;

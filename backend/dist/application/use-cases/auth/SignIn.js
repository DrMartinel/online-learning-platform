"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignInUseCase = void 0;
const AuthErrors_1 = require("../../../domain/errors/AuthErrors");
class SignInUseCase {
    authRepository;
    constructor(authRepository) {
        this.authRepository = authRepository;
    }
    async execute(dto) {
        if (!dto.email) {
            throw new AuthErrors_1.AuthenticationError('Email is required for sign in');
        }
        const session = await this.authRepository.signIn({
            email: dto.email,
            password: dto.password
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
exports.SignInUseCase = SignInUseCase;

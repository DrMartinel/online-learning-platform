"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSession = void 0;
class AuthSession {
    accessToken;
    refreshToken;
    userId;
    role;
    expiresAt;
    constructor(accessToken, refreshToken, userId, role, expiresAt) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.role = role;
        this.expiresAt = expiresAt;
    }
}
exports.AuthSession = AuthSession;

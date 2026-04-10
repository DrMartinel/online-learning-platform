"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAlreadyExistsError = exports.AuthenticationError = void 0;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class UserAlreadyExistsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserAlreadyExistsError';
    }
}
exports.UserAlreadyExistsError = UserAlreadyExistsError;

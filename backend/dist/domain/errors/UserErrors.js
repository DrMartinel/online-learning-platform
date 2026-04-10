"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.UserNotFoundError = void 0;
class UserNotFoundError extends Error {
    id;
    constructor(id) {
        super(`User with ID ${id} was not found.`);
        this.id = id;
        this.name = 'UserNotFoundError';
    }
}
exports.UserNotFoundError = UserNotFoundError;
class UnauthorizedError extends Error {
    constructor(message = 'User is not authorized to perform this action.') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;

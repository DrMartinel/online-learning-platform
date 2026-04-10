"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toHttpError = toHttpError;
const AuthErrors_1 = require("../../domain/errors/AuthErrors");
const UserErrors_1 = require("../../domain/errors/UserErrors");
function toHttpError(error) {
    if (error instanceof AuthErrors_1.UserAlreadyExistsError) {
        return { statusCode: 409, body: { error: error.message } };
    }
    if (error instanceof AuthErrors_1.AuthenticationError) {
        return { statusCode: 401, body: { error: error.message } };
    }
    if (error instanceof UserErrors_1.UnauthorizedError) {
        return { statusCode: 403, body: { error: error.message } };
    }
    if (error instanceof UserErrors_1.UserNotFoundError) {
        return { statusCode: 404, body: { error: error.message } };
    }
    if (error instanceof Error) {
        return { statusCode: 400, body: { error: error.message } };
    }
    return { statusCode: 400, body: { error: String(error) } };
}

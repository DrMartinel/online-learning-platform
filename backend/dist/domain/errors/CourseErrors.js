"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseUnauthorizedError = exports.CourseValidationError = exports.CourseNotFoundError = exports.CourseError = void 0;
class CourseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CourseError';
    }
}
exports.CourseError = CourseError;
class CourseNotFoundError extends CourseError {
    constructor(courseId) {
        super(`Course with id ${courseId} not found`);
        this.name = 'CourseNotFoundError';
    }
}
exports.CourseNotFoundError = CourseNotFoundError;
class CourseValidationError extends CourseError {
    constructor(message) {
        super(`Course validation error: ${message}`);
        this.name = 'CourseValidationError';
    }
}
exports.CourseValidationError = CourseValidationError;
class CourseUnauthorizedError extends CourseError {
    constructor(message = 'This user is not authorized to perform this action') {
        super(message);
        this.name = 'CourseUnauthorizedError';
    }
}
exports.CourseUnauthorizedError = CourseUnauthorizedError;

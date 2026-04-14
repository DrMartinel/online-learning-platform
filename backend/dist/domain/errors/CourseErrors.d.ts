export declare class CourseError extends Error {
    constructor(message: string);
}
export declare class CourseNotFoundError extends CourseError {
    constructor(courseId: string);
}
export declare class CourseValidationError extends CourseError {
    constructor(message: string);
}
export declare class CourseUnauthorizedError extends CourseError {
    constructor(message?: string);
}
//# sourceMappingURL=CourseErrors.d.ts.map
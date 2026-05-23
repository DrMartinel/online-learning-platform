export class CourseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseError';
  }
}

export class CourseNotFoundError extends CourseError {
  constructor(courseId: string) {
    super(`Course with id ${courseId} not found`);
    this.name = 'CourseNotFoundError';
  }
}

export class CourseValidationError extends CourseError {
  constructor(message: string) {
    super(`Course validation error: ${message}`);
    this.name = 'CourseValidationError';
  }
}

export class CourseUnauthorizedError extends CourseError {
  constructor(message: string = 'This user is not authorized to perform this action') {
    super(message);
    this.name = 'CourseUnauthorizedError';
  }
}

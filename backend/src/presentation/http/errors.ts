import { AuthenticationError, UserAlreadyExistsError } from '../../domain/errors/AuthErrors';
import { UnauthorizedError, UserNotFoundError } from '../../domain/errors/UserErrors';
import { CourseError, CourseNotFoundError, CourseValidationError, CourseUnauthorizedError } from '../../domain/errors/CourseErrors';

export function toHttpError(error: unknown): { statusCode: number; body: { error: string } } {
  if (error instanceof UserAlreadyExistsError) {
    return { statusCode: 409, body: { error: error.message } };
  }

  if (error instanceof AuthenticationError) {
    return { statusCode: 401, body: { error: error.message } };
  }

  if (error instanceof UnauthorizedError) {
    return { statusCode: 403, body: { error: error.message } };
  }

  if (error instanceof UserNotFoundError) {
    return { statusCode: 404, body: { error: error.message } };
  }

  if (error instanceof CourseNotFoundError) {
    return { statusCode: 404, body: { error: error.message } };
  }

  if (error instanceof CourseValidationError) {
    return { statusCode: 400, body: { error: error.message } };
  }

  if (error instanceof CourseUnauthorizedError) {
    return { statusCode: 403, body: { error: error.message } };
  }

  if (error instanceof CourseError) {
    return { statusCode: 400, body: { error: error.message } };
  }

  if (error instanceof Error) {
    return { statusCode: 400, body: { error: error.message } };
  }

  return { statusCode: 400, body: { error: String(error) } };
}


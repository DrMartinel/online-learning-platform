export class QuestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuestionError';
  }
}

export class QuestionNotFoundError extends QuestionError {
  constructor(questionId: string) {
    super(`Question with id ${questionId} not found`);
    this.name = 'QuestionNotFoundError';
  }
}

export class QuestionVariantNotFoundError extends QuestionError {
  constructor(variantId: string) {
    super(`Question variant with id ${variantId} not found`);
    this.name = 'QuestionVariantNotFoundError';
  }
}

export class QuestionValidationError extends QuestionError {
  constructor(message: string) {
    super(`Question validation error: ${message}`);
    this.name = 'QuestionValidationError';
  }
}

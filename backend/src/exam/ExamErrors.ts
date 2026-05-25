export class ExamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExamError';
  }
}

export class ExamNotFoundError extends ExamError {
  constructor(examId: string) {
    super(`Exam with id ${examId} not found`);
    this.name = 'ExamNotFoundError';
  }
}

export class ExamQuestionNotFoundError extends ExamError {
  constructor(examQuestionId: string) {
    super(`Exam question with id ${examQuestionId} not found`);
    this.name = 'ExamQuestionNotFoundError';
  }
}

export class ExamValidationError extends ExamError {
  constructor(message: string) {
    super(`Exam validation error: ${message}`);
    this.name = 'ExamValidationError';
  }
}

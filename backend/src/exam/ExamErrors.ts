import { NotFoundException, BadRequestException } from '@nestjs/common';

export class ExamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExamError';
  }
}

export class ExamNotFoundError extends NotFoundException {
  constructor(examId: string) {
    super(`Exam with id ${examId} not found`);
    this.name = 'ExamNotFoundError';
  }
}

export class ExamQuestionNotFoundError extends NotFoundException {
  constructor(examQuestionId: string) {
    super(`Exam question with id ${examQuestionId} not found`);
    this.name = 'ExamQuestionNotFoundError';
  }
}

export class ExamValidationError extends BadRequestException {
  constructor(message: string) {
    super(`Exam validation error: ${message}`);
    this.name = 'ExamValidationError';
  }
}


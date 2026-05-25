import { Inject, Injectable } from '@nestjs/common';
import { IExamRepository } from '../repositories/IExamRepository';
import { ExamNotFoundError, ExamQuestionNotFoundError } from '../ExamErrors';
import { Exam } from '../entities/Exam';
import { ExamQuestion } from '../entities/ExamQuestion';
import {
  CreateExamDTO,
  UpdateExamDTO,
  AddExamQuestionDTO,
  UpdateExamQuestionDTO,
  ExamResponseDTO,
  ExamQuestionResponseDTO,
  ListExamsFilterDTO,
} from '../dto/exam.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ExamService {
  constructor(
    @Inject('IExamRepository')
    private readonly examRepo: IExamRepository,
  ) {}

  async create(userId: string, dto: CreateExamDTO): Promise<ExamResponseDTO> {
    const examId = randomUUID();
    const exam = new Exam(
      examId,
      dto.courseId || null,
      userId,
      dto.title,
      dto.headerContent || null,
      new Date(),
    );
    await this.examRepo.create(exam);

    // Add questions if provided inline
    const examQuestions: ExamQuestion[] = [];
    if (dto.questions && dto.questions.length > 0) {
      for (const q of dto.questions) {
        const eq = new ExamQuestion(
          randomUUID(),
          examId,
          q.questionId,
          q.orderIndex,
          q.points ?? 1,
        );
        const created = await this.examRepo.addQuestion(eq);
        examQuestions.push(created);
      }
    }

    return this.mapToResponse(exam, examQuestions);
  }

  async findById(id: string): Promise<ExamResponseDTO> {
    const exam = await this.examRepo.findById(id);
    if (!exam) {
      throw new ExamNotFoundError(id);
    }
    const questions = await this.examRepo.findQuestionsByExamId(id);
    return this.mapToResponse(exam, questions);
  }

  async list(filter: ListExamsFilterDTO): Promise<ExamResponseDTO[]> {
    const exams = await this.examRepo.findAll(filter);
    const result: ExamResponseDTO[] = [];
    for (const exam of exams) {
      const questions = await this.examRepo.findQuestionsByExamId(exam.id);
      result.push(this.mapToResponse(exam, questions));
    }
    return result;
  }

  async update(id: string, dto: UpdateExamDTO): Promise<ExamResponseDTO> {
    const exam = await this.examRepo.findById(id);
    if (!exam) {
      throw new ExamNotFoundError(id);
    }
    if (dto.title !== undefined) exam.title = dto.title;
    if (dto.headerContent !== undefined) exam.headerContent = dto.headerContent || null;

    await this.examRepo.update(exam);
    const questions = await this.examRepo.findQuestionsByExamId(id);
    return this.mapToResponse(exam, questions);
  }

  async delete(id: string): Promise<void> {
    const exam = await this.examRepo.findById(id);
    if (!exam) {
      throw new ExamNotFoundError(id);
    }
    await this.examRepo.delete(id);
  }

  // --- Exam question operations ---

  async addQuestion(examId: string, dto: AddExamQuestionDTO): Promise<ExamQuestionResponseDTO> {
    const exam = await this.examRepo.findById(examId);
    if (!exam) {
      throw new ExamNotFoundError(examId);
    }

    const eq = new ExamQuestion(
      randomUUID(),
      examId,
      dto.questionId,
      dto.orderIndex,
      dto.points ?? 1,
    );
    const created = await this.examRepo.addQuestion(eq);
    return this.mapExamQuestionToResponse(created);
  }

  async updateExamQuestion(examId: string, eqId: string, dto: UpdateExamQuestionDTO): Promise<ExamQuestionResponseDTO> {
    const exam = await this.examRepo.findById(examId);
    if (!exam) {
      throw new ExamNotFoundError(examId);
    }

    const eq = await this.examRepo.findExamQuestionById(eqId);
    if (!eq || eq.examId !== examId) {
      throw new ExamQuestionNotFoundError(eqId);
    }

    if (dto.orderIndex !== undefined) eq.orderIndex = dto.orderIndex;
    if (dto.points !== undefined) eq.points = dto.points;

    const updated = await this.examRepo.updateExamQuestion(eq);
    return this.mapExamQuestionToResponse(updated);
  }

  async removeQuestion(examId: string, eqId: string): Promise<void> {
    const exam = await this.examRepo.findById(examId);
    if (!exam) {
      throw new ExamNotFoundError(examId);
    }

    const eq = await this.examRepo.findExamQuestionById(eqId);
    if (!eq || eq.examId !== examId) {
      throw new ExamQuestionNotFoundError(eqId);
    }

    await this.examRepo.removeQuestion(eqId);
  }

  // --- Mappers ---

  private mapToResponse(exam: Exam, questions: ExamQuestion[]): ExamResponseDTO {
    return {
      id: exam.id,
      courseId: exam.courseId,
      createdBy: exam.createdBy,
      title: exam.title,
      headerContent: exam.headerContent,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      questions: questions.map((eq) => this.mapExamQuestionToResponse(eq)),
    };
  }

  private mapExamQuestionToResponse(eq: ExamQuestion): ExamQuestionResponseDTO {
    return {
      id: eq.id,
      examId: eq.examId,
      questionId: eq.questionId,
      orderIndex: eq.orderIndex,
      points: eq.points,
    };
  }
}

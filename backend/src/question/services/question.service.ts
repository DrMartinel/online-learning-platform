import { Inject, Injectable } from '@nestjs/common';
import { IQuestionRepository } from '../repositories/IQuestionRepository';
import { QuestionNotFoundError, QuestionVariantNotFoundError } from '../QuestionErrors';
import { Question } from '../entities/Question';
import { QuestionVariant } from '../entities/QuestionVariant';
import {
  CreateQuestionDTO,
  UpdateQuestionDTO,
  CreateVariantDTO,
  UpdateVariantDTO,
  QuestionResponseDTO,
  VariantResponseDTO,
  ListQuestionsFilterDTO,
} from '../dto/question.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class QuestionService {
  constructor(
    @Inject('IQuestionRepository')
    private readonly questionRepo: IQuestionRepository,
  ) {}

  async create(dto: CreateQuestionDTO): Promise<QuestionResponseDTO> {
    const questionId = randomUUID();
    const question = new Question(
      questionId,
      dto.type,
      dto.tags || [],
      new Date(),
    );
    await this.questionRepo.create(question);

    // Create variants
    const variants: QuestionVariant[] = [];
    for (let i = 0; i < dto.variants.length; i++) {
      const v = dto.variants[i];
      const variant = new QuestionVariant(
        randomUUID(),
        questionId,
        i,
        v.content,
        v.options || null,
        v.correctAnswer || null,
        v.explanation || null,
        new Date(),
      );
      const created = await this.questionRepo.createVariant(variant);
      variants.push(created);
    }

    return this.mapToResponse(question, variants);
  }

  async findById(id: string): Promise<QuestionResponseDTO> {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      throw new QuestionNotFoundError(id);
    }
    const variants = await this.questionRepo.findVariantsByQuestionId(id);
    return this.mapToResponse(question, variants);
  }

  async list(filter: ListQuestionsFilterDTO): Promise<QuestionResponseDTO[]> {
    const questions = await this.questionRepo.findAll(filter);
    const result: QuestionResponseDTO[] = [];
    for (const q of questions) {
      const variants = await this.questionRepo.findVariantsByQuestionId(q.id);
      result.push(this.mapToResponse(q, variants));
    }
    return result;
  }

  async update(id: string, dto: UpdateQuestionDTO): Promise<QuestionResponseDTO> {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      throw new QuestionNotFoundError(id);
    }
    if (dto.type) question.type = dto.type;
    if (dto.tags !== undefined) question.tags = dto.tags;

    await this.questionRepo.update(question);
    const variants = await this.questionRepo.findVariantsByQuestionId(id);
    return this.mapToResponse(question, variants);
  }

  async delete(id: string): Promise<void> {
    const question = await this.questionRepo.findById(id);
    if (!question) {
      throw new QuestionNotFoundError(id);
    }
    await this.questionRepo.delete(id);
  }

  // --- Variant operations ---

  async addVariant(questionId: string, dto: CreateVariantDTO): Promise<VariantResponseDTO> {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new QuestionNotFoundError(questionId);
    }

    const nextIndex = await this.questionRepo.getNextVariantIndex(questionId);
    const variant = new QuestionVariant(
      randomUUID(),
      questionId,
      nextIndex,
      dto.content,
      dto.options || null,
      dto.correctAnswer || null,
      dto.explanation || null,
      new Date(),
    );

    const created = await this.questionRepo.createVariant(variant);
    return this.mapVariantToResponse(created);
  }

  async updateVariant(questionId: string, variantId: string, dto: UpdateVariantDTO): Promise<VariantResponseDTO> {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new QuestionNotFoundError(questionId);
    }

    const variant = await this.questionRepo.findVariantById(variantId);
    if (!variant || variant.questionId !== questionId) {
      throw new QuestionVariantNotFoundError(variantId);
    }

    if (dto.content !== undefined) variant.content = dto.content;
    if (dto.options !== undefined) variant.options = dto.options || null;
    if (dto.correctAnswer !== undefined) variant.correctAnswer = dto.correctAnswer || null;
    if (dto.explanation !== undefined) variant.explanation = dto.explanation || null;

    const updated = await this.questionRepo.updateVariant(variant);
    return this.mapVariantToResponse(updated);
  }

  async deleteVariant(questionId: string, variantId: string): Promise<void> {
    const question = await this.questionRepo.findById(questionId);
    if (!question) {
      throw new QuestionNotFoundError(questionId);
    }

    const variant = await this.questionRepo.findVariantById(variantId);
    if (!variant || variant.questionId !== questionId) {
      throw new QuestionVariantNotFoundError(variantId);
    }

    await this.questionRepo.deleteVariant(variantId);
  }

  // --- Mappers ---

  private mapToResponse(question: Question, variants: QuestionVariant[]): QuestionResponseDTO {
    return {
      id: question.id,
      type: question.type,
      tags: question.tags,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      variants: variants.map((v) => this.mapVariantToResponse(v)),
    };
  }

  private mapVariantToResponse(variant: QuestionVariant): VariantResponseDTO {
    return {
      id: variant.id,
      questionId: variant.questionId,
      variantIndex: variant.variantIndex,
      content: variant.content,
      options: variant.options,
      correctAnswer: variant.correctAnswer,
      explanation: variant.explanation,
      createdAt: variant.createdAt,
    };
  }
}

import { Question } from '../entities/Question';
import { QuestionVariant } from '../entities/QuestionVariant';
import { ListQuestionsFilterDTO } from '../dto/question.dto';

export interface IQuestionRepository {
  // Question CRUD
  create(question: Question): Promise<Question>;
  findById(id: string): Promise<Question | null>;
  findAll(filter?: ListQuestionsFilterDTO): Promise<Question[]>;
  update(question: Question): Promise<Question>;
  delete(id: string): Promise<void>;

  // Variant CRUD
  createVariant(variant: QuestionVariant): Promise<QuestionVariant>;
  findVariantsByQuestionId(questionId: string): Promise<QuestionVariant[]>;
  findVariantById(id: string): Promise<QuestionVariant | null>;
  updateVariant(variant: QuestionVariant): Promise<QuestionVariant>;
  deleteVariant(id: string): Promise<void>;
  getNextVariantIndex(questionId: string): Promise<number>;
}

import { Exam } from '../entities/Exam';
import { ExamQuestion } from '../entities/ExamQuestion';
import { ListExamsFilterDTO } from '../dto/exam.dto';

export interface IExamRepository {
  // Exam CRUD
  create(exam: Exam): Promise<Exam>;
  findById(id: string): Promise<Exam | null>;
  findAll(filter?: ListExamsFilterDTO): Promise<Exam[]>;
  update(exam: Exam): Promise<Exam>;
  delete(id: string): Promise<void>;

  // Exam Question (join) CRUD
  addQuestion(examQuestion: ExamQuestion): Promise<ExamQuestion>;
  findQuestionsByExamId(examId: string): Promise<ExamQuestion[]>;
  findExamQuestionById(id: string): Promise<ExamQuestion | null>;
  updateExamQuestion(examQuestion: ExamQuestion): Promise<ExamQuestion>;
  removeQuestion(id: string): Promise<void>;
}

import { SupabaseClient } from '@supabase/supabase-js';
import { Exam } from '../entities/Exam';
import { ExamQuestion } from '../entities/ExamQuestion';
import { IExamRepository } from './IExamRepository';
import { ListExamsFilterDTO } from '../dto/exam.dto';

export class SupabaseExamRepository implements IExamRepository {
  constructor(private client: SupabaseClient) {}

  // --- Mappers ---

  private mapToExam(row: any): Exam {
    return new Exam(
      row.id,
      row.course_id,
      row.created_by,
      row.title,
      row.header_content,
      new Date(row.created_at),
      row.updated_at ? new Date(row.updated_at) : undefined,
    );
  }

  private mapToExamQuestion(row: any): ExamQuestion {
    return new ExamQuestion(
      row.id,
      row.exam_id,
      row.question_id,
      row.order_index,
      parseFloat(row.points),
    );
  }

  // --- Exam CRUD ---

  async create(exam: Exam): Promise<Exam> {
    const { data, error } = await this.client
      .from('exams')
      .insert({
        id: exam.id,
        course_id: exam.courseId,
        created_by: exam.createdBy,
        title: exam.title,
        header_content: exam.headerContent,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToExam(data);
  }

  async findById(id: string): Promise<Exam | null> {
    const { data, error } = await this.client
      .from('exams')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToExam(data);
  }

  async findAll(filter?: ListExamsFilterDTO): Promise<Exam[]> {
    let query = this.client.from('exams').select();

    if (filter?.courseId) {
      query = query.eq('course_id', filter.courseId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data.map((row: any) => this.mapToExam(row));
  }

  async update(exam: Exam): Promise<Exam> {
    const { data, error } = await this.client
      .from('exams')
      .update({
        title: exam.title,
        header_content: exam.headerContent,
        course_id: exam.courseId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exam.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToExam(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --- Exam Question CRUD ---

  async addQuestion(examQuestion: ExamQuestion): Promise<ExamQuestion> {
    const { data, error } = await this.client
      .from('exam_questions')
      .insert({
        id: examQuestion.id,
        exam_id: examQuestion.examId,
        question_id: examQuestion.questionId,
        order_index: examQuestion.orderIndex,
        points: examQuestion.points,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToExamQuestion(data);
  }

  async findQuestionsByExamId(examId: string): Promise<ExamQuestion[]> {
    const { data, error } = await this.client
      .from('exam_questions')
      .select()
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data.map((row: any) => this.mapToExamQuestion(row));
  }

  async findExamQuestionById(id: string): Promise<ExamQuestion | null> {
    const { data, error } = await this.client
      .from('exam_questions')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToExamQuestion(data);
  }

  async updateExamQuestion(examQuestion: ExamQuestion): Promise<ExamQuestion> {
    const { data, error } = await this.client
      .from('exam_questions')
      .update({
        order_index: examQuestion.orderIndex,
        points: examQuestion.points,
      })
      .eq('id', examQuestion.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToExamQuestion(data);
  }

  async removeQuestion(id: string): Promise<void> {
    const { error } = await this.client
      .from('exam_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

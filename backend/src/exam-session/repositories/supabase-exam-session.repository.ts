import { SupabaseClient } from '@supabase/supabase-js';
import { ExamSession } from '../entities/ExamSession';
import { ExamAttempt } from '../entities/ExamAttempt';
import { IExamSessionRepository } from './IExamSessionRepository';

export class SupabaseExamSessionRepository implements IExamSessionRepository {
  constructor(private client: SupabaseClient) {}

  // --- Mappers ---

  private mapToExamSession(row: any): ExamSession {
    return new ExamSession(
      row.id,
      row.title,
      row.exam_id,
      row.course_id,
      new Date(row.start_time),
      new Date(row.end_time),
      row.duration_minutes,
      row.access_code,
      row.status || 'draft',
      row.created_by,
      new Date(row.created_at),
      row.updated_at ? new Date(row.updated_at) : undefined,
    );
  }

  private mapToExamAttempt(row: any): ExamAttempt {
    return new ExamAttempt(
      row.id,
      row.session_id,
      row.user_id,
      new Date(row.start_time),
      row.submit_time ? new Date(row.submit_time) : null,
      row.answers || {},
      row.score !== null ? parseFloat(row.score) : null,
      row.status || 'inprogress',
      new Date(row.created_at),
      row.graded_at ? new Date(row.graded_at) : null,
    );
  }

  // --- ExamSession CRUD ---

  async create(examSession: ExamSession): Promise<ExamSession> {
    const { data, error } = await this.client
      .from('exam_sessions')
      .insert({
        id: examSession.id,
        title: examSession.title,
        exam_id: examSession.examId,
        course_id: examSession.courseId,
        start_time: examSession.startTime.toISOString(),
        end_time: examSession.endTime.toISOString(),
        duration_minutes: examSession.durationMinutes,
        access_code: examSession.accessCode,
        status: examSession.status,
        created_by: examSession.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToExamSession(data);
  }

  async findById(id: string): Promise<ExamSession | null> {
    const { data, error } = await this.client
      .from('exam_sessions')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToExamSession(data);
  }

  async findAll(): Promise<ExamSession[]> {
    const { data, error } = await this.client
      .from('exam_sessions')
      .select()
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => this.mapToExamSession(row));
  }

  async findByCourseId(courseId: string): Promise<ExamSession[]> {
    const { data, error } = await this.client
      .from('exam_sessions')
      .select()
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => this.mapToExamSession(row));
  }

  async findActiveSessions(): Promise<ExamSession[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('exam_sessions')
      .select()
      .eq('status', 'active')
      .lte('start_time', now)
      .gte('end_time', now)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => this.mapToExamSession(row));
  }

  async update(examSession: ExamSession): Promise<ExamSession> {
    const { data, error } = await this.client
      .from('exam_sessions')
      .update({
        title: examSession.title,
        exam_id: examSession.examId,
        course_id: examSession.courseId,
        start_time: examSession.startTime.toISOString(),
        end_time: examSession.endTime.toISOString(),
        duration_minutes: examSession.durationMinutes,
        access_code: examSession.accessCode,
        status: examSession.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', examSession.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToExamSession(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('exam_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // --- ExamAttempt CRUD ---

  async createAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
    const { data, error } = await this.client
      .from('exam_attempts')
      .insert({
        id: attempt.id,
        session_id: attempt.sessionId,
        user_id: attempt.userId,
        start_time: attempt.startTime.toISOString(),
        answers: attempt.answers,
        score: attempt.score,
        status: attempt.status,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToExamAttempt(data);
  }

  async findAttemptById(id: string): Promise<ExamAttempt | null> {
    const { data, error } = await this.client
      .from('exam_attempts')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToExamAttempt(data);
  }

  async findAttemptByUserAndSession(userId: string, sessionId: string): Promise<ExamAttempt | null> {
    const { data, error } = await this.client
      .from('exam_attempts')
      .select()
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToExamAttempt(data);
  }

  async findAttemptsBySessionId(sessionId: string): Promise<ExamAttempt[]> {
    const { data, error } = await this.client
      .from('exam_attempts')
      .select()
      .eq('session_id', sessionId)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data.map((row) => this.mapToExamAttempt(row));
  }

  async updateAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
    const { data, error } = await this.client
      .from('exam_attempts')
      .update({
        submit_time: attempt.submitTime ? attempt.submitTime.toISOString() : null,
        answers: attempt.answers,
        score: attempt.score,
        status: attempt.status,
        graded_at: attempt.gradedAt ? attempt.gradedAt.toISOString() : null,
      })
      .eq('id', attempt.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToExamAttempt(data);
  }
}

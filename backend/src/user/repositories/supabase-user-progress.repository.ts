import { SupabaseClient } from '@supabase/supabase-js';
import { IUserProgressRepository } from './IUserProgressRepository';
import { CreateUserProgressDTO, UpdateUserProgressDTO } from '../dto/user-progress.dto';

export class SupabaseUserProgressRepository implements IUserProgressRepository {
  constructor(private client: SupabaseClient) {}

  private mapToUserProgress(row: any): any {
    return {
      userId: row.user_id,
      courseId: row.lessons?.course_id,
      lessonId: row.lesson_id,
      isCompleted: row.completed,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  }

  async createOrUpdate(dto: any): Promise<any> {
    const { data, error } = await this.client
      .from('user_progress')
      .upsert(
        {
          user_id: dto.userId,
          lesson_id: dto.lessonId,
          completed: dto.isCompleted,
          completed_at: dto.isCompleted ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id, lesson_id' }
      )
      .select('*, lessons(course_id)')
      .single();

    if (error) throw error;
    return this.mapToUserProgress(data);
  }

  async findByLesson(userId: string, lessonId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('user_progress')
      .select('*, lessons(course_id)')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToUserProgress(data);
  }

  async findByCourse(userId: string, courseId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('user_progress')
      .select('*, lessons!inner(course_id)')
      .eq('user_id', userId)
      .eq('lessons.course_id', courseId);

    if (error) throw error;
    return data.map(this.mapToUserProgress);
  }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { IUserProgressRepository } from './IUserProgressRepository';

export class SupabaseUserProgressRepository implements IUserProgressRepository {
  constructor(private client: SupabaseClient) {}

  private mapToUserProgress(row: any): any {
    return {
      userId: row.user_id,
      courseId: row.lessons?.course_id ?? undefined,
      lessonId: row.lesson_id,
      isCompleted: row.completed,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    };
  }

  async createOrUpdate(dto: any): Promise<any> {
    const { data, error } = await this.client
      .from('user_progress')
      .upsert(
        {
          user_id: dto.userId,
          lesson_id: dto.lessonId,
          completed: dto.isCompleted ?? false,
          completed_at: dto.isCompleted ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id,lesson_id' }
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
    return (data ?? []).map((row) => this.mapToUserProgress(row));
  }

  async countCourseLessons(courseId: string): Promise<number> {
    const { count, error } = await this.client
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (error) throw error;
    return count ?? 0;
  }
}

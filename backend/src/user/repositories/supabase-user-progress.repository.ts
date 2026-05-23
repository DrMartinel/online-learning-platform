import { SupabaseClient } from '@supabase/supabase-js';
import { IUserProgressRepository } from './IUserProgressRepository';
import { CreateUserProgressDTO, UpdateUserProgressDTO } from '../dto/user-progress.dto';

export class SupabaseUserProgressRepository implements IUserProgressRepository {
  constructor(private client: SupabaseClient) {}

  private mapToUserProgress(row: any): any {
    return {
      userId: row.user_id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      isCompleted: row.is_completed,
      lastPosition: row.last_position,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      updatedAt: new Date(row.updated_at),
    };
  }

  async createOrUpdate(dto: any): Promise<any> {
    const { data, error } = await this.client
      .from('user_progress')
      .upsert(
        {
          user_id: dto.userId,
          course_id: dto.courseId,
          lesson_id: dto.lessonId,
          is_completed: dto.isCompleted,
          last_position: dto.lastPosition,
          completed_at: dto.isCompleted ? new Date().toISOString() : null,
        },
        { onConflict: 'user_id, lesson_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return this.mapToUserProgress(data);
  }

  async findByLesson(userId: string, lessonId: string): Promise<any | null> {
    const { data, error } = await this.client
      .from('user_progress')
      .select()
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
      .select()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) throw error;
    return data.map(this.mapToUserProgress);
  }
}

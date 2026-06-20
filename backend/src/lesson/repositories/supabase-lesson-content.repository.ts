import { SupabaseClient } from '@supabase/supabase-js';
import { LessonContent } from '../entities/LessonContent';
import { ILessonContentRepository } from './ILessonContentRepository';

export class SupabaseLessonContentRepository implements ILessonContentRepository {
  constructor(private readonly client: SupabaseClient) {}

  private mapToContent(row: any): LessonContent {
    return new LessonContent(
      row.id,
      row.lesson_id,
      row.type as 'video' | 'document' | 'exam',
      row.title,
      row.url,
      row.duration_minutes !== null ? Number(row.duration_minutes) : null,
      row.order_index,
      new Date(row.created_at),
      row.updated_at ? new Date(row.updated_at) : undefined
    );
  }

  async create(content: LessonContent): Promise<LessonContent> {
    const { data, error } = await this.client
      .from('lesson_contents')
      .insert({
        id: content.id,
        lesson_id: content.lessonId,
        type: content.type,
        title: content.title,
        url: content.url,
        duration_minutes: content.durationMinutes,
        order_index: content.orderIndex,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToContent(data);
  }

  async findById(id: string): Promise<LessonContent | null> {
    const { data, error } = await this.client
      .from('lesson_contents')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToContent(data);
  }

  async findByLessonId(lessonId: string): Promise<LessonContent[]> {
    const { data, error } = await this.client
      .from('lesson_contents')
      .select()
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => this.mapToContent(row));
  }

  async update(content: LessonContent): Promise<LessonContent> {
    const { data, error } = await this.client
      .from('lesson_contents')
      .update({
        title: content.title,
        url: content.url,
        duration_minutes: content.durationMinutes,
        order_index: content.orderIndex,
        updated_at: new Date().toISOString(),
      })
      .eq('id', content.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToContent(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('lesson_contents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

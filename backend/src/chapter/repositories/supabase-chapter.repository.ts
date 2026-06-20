import { SupabaseClient } from '@supabase/supabase-js';
import { Chapter } from '../entities/Chapter';
import { IChapterRepository } from './IChapterRepository';

export class SupabaseChapterRepository implements IChapterRepository {
  constructor(private readonly client: SupabaseClient) {}

  private mapToChapter(row: any): Chapter {
    return new Chapter(
      row.id,
      row.course_id,
      row.title,
      row.order_index,
      new Date(row.created_at),
      row.updated_at ? new Date(row.updated_at) : undefined
    );
  }

  async create(chapter: Chapter): Promise<Chapter> {
    const { data, error } = await this.client
      .from('chapters')
      .insert({
        id: chapter.id,
        course_id: chapter.courseId,
        title: chapter.title,
        order_index: chapter.orderIndex,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToChapter(data);
  }

  async findById(id: string): Promise<Chapter | null> {
    const { data, error } = await this.client
      .from('chapters')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToChapter(data);
  }

  async findByCourseId(courseId: string): Promise<Chapter[]> {
    const { data, error } = await this.client
      .from('chapters')
      .select()
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => this.mapToChapter(row));
  }

  async update(chapter: Chapter): Promise<Chapter> {
    const { data, error } = await this.client
      .from('chapters')
      .update({
        title: chapter.title,
        order_index: chapter.orderIndex,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapter.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToChapter(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('chapters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

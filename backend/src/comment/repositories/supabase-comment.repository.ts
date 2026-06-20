import { SupabaseClient } from '@supabase/supabase-js';
import { Comment } from '../entities/Comment';
import { ICommentRepository } from './ICommentRepository';

export class SupabaseCommentRepository implements ICommentRepository {
  constructor(private readonly client: SupabaseClient) {}

  private mapToComment(row: any): Comment {
    return new Comment(
      row.id,
      row.lesson_id,
      row.user_id,
      row.content,
      row.parent_id,
      new Date(row.created_at),
      row.updated_at ? new Date(row.updated_at) : undefined
    );
  }

  async create(comment: Comment): Promise<Comment> {
    const { data, error } = await this.client
      .from('comments')
      .insert({
        id: comment.id,
        lesson_id: comment.lessonId,
        user_id: comment.userId,
        content: comment.content,
        parent_id: comment.parentId,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToComment(data);
  }

  async findById(id: string): Promise<Comment | null> {
    const { data, error } = await this.client
      .from('comments')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToComment(data);
  }

  async findByLessonId(lessonId: string): Promise<(Comment & { userFullName?: string; userAvatarUrl?: string })[]> {
    const { data, error } = await this.client
      .from('comments')
      .select(`
        id,
        lesson_id,
        user_id,
        content,
        parent_id,
        created_at,
        updated_at,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => {
      const comment = this.mapToComment(row);
      return {
        id: comment.id,
        lessonId: comment.lessonId,
        userId: comment.userId,
        content: comment.content,
        parentId: comment.parentId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        userFullName: row.profiles?.full_name || undefined,
        userAvatarUrl: row.profiles?.avatar_url || undefined,
      } as any;
    });
  }

  async update(comment: Comment): Promise<Comment> {
    const { data, error } = await this.client
      .from('comments')
      .update({
        content: comment.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', comment.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToComment(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

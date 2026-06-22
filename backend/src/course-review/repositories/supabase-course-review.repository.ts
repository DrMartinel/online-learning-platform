import { SupabaseClient } from '@supabase/supabase-js';
import { CourseReview } from '../entities/CourseReview';
import { ICourseReviewRepository } from './ICourseReviewRepository';

export class SupabaseCourseReviewRepository implements ICourseReviewRepository {
  constructor(private client: SupabaseClient) {}

  private mapToCourseReview(row: any): CourseReview {
    return new CourseReview(
      row.id,
      row.user_id,
      row.course_id,
      Number(row.rating),
      row.comment || null,
      row.status,
      row.response || null,
      row.responded_at ? new Date(row.responded_at) : null,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async create(review: CourseReview): Promise<CourseReview> {
    const { data, error } = await this.client
      .from('course_reviews')
      .insert({
        id: review.id,
        user_id: review.userId,
        course_id: review.courseId,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToCourseReview(data);
  }

  async findById(id: string): Promise<CourseReview | null> {
    const { data, error } = await this.client
      .from('course_reviews')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToCourseReview(data);
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<CourseReview | null> {
    const { data, error } = await this.client
      .from('course_reviews')
      .select()
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.mapToCourseReview(data);
  }

  async findApprovedByCourse(courseId: string): Promise<any[]> {
    const { data, error } = await this.client
      .from('course_reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('course_id', courseId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findAllAdmin(filters: { courseId?: string; rating?: number; status?: string }): Promise<any[]> {
    let query = this.client
      .from('course_reviews')
      .select('*, profiles(full_name, avatar_url), courses(title)')
      .order('created_at', { ascending: false });

    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    if (filters.rating) {
      query = query.eq('rating', filters.rating);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async update(review: CourseReview): Promise<CourseReview> {
    const { data, error } = await this.client
      .from('course_reviews')
      .update({
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        response: review.response,
        responded_at: review.respondedAt ? review.respondedAt.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', review.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCourseReview(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('course_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { Course } from '../entities/Course';
import { ICourseRepository } from './ICourseRepository';
import { ListCoursesFilterDTO } from '../dto/course.dto';

export class SupabaseCourseRepository implements ICourseRepository {
  constructor(private client: SupabaseClient) {}

  private mapToCourse(row: any): Course {
    return new Course(
      row.id,
      row.instructor_id,
      row.title,
      row.description,
      row.thumbnail_url,
      row.is_published,
      new Date(row.created_at),
      row.price ? Number(row.price) : 0,                    
      row.updated_at ? new Date(row.updated_at) : undefined
    );
  }

  async create(course: Course): Promise<Course> {
    const { data, error } = await this.client
      .from('courses')
      .insert({
        id: course.id,
        instructor_id: course.instructorId,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        is_published: course.isPublished,
        price: course.price,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToCourse(data);
  }

  async findById(id: string): Promise<Course | null> {
    const { data, error } = await this.client
      .from('courses')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const course = this.mapToCourse(data);

    // Fetch approved reviews count and average
    const { data: reviews, error: reviewsError } = await this.client
      .from('course_reviews')
      .select('rating')
      .eq('course_id', id)
      .eq('status', 'approved');

    let ratingAverage = 0;
    let ratingCount = 0;
    if (reviews && !reviewsError && reviews.length > 0) {
      const total = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
      ratingAverage = Number((total / reviews.length).toFixed(1));
      ratingCount = reviews.length;
    }

    return {
      ...course,
      ratingAverage,
      ratingCount,
    } as any;
  }

  async findAll(filter?: ListCoursesFilterDTO): Promise<Course[]> {
    let query = this.client.from('courses').select();

    if (filter?.instructorId) {
      query = query.eq('instructor_id', filter.instructorId);
    }
    if (filter?.published !== undefined) {
      query = query.eq('is_published', filter.published);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Fetch approved reviews to calculate aggregates
    const { data: reviews, error: reviewsError } = await this.client
      .from('course_reviews')
      .select('course_id, rating')
      .eq('status', 'approved');

    const statsMap: Record<string, { total: number; count: number }> = {};
    if (reviews && !reviewsError) {
      for (const r of reviews) {
        const cId = r.course_id;
        const rating = Number(r.rating);
        if (!statsMap[cId]) {
          statsMap[cId] = { total: 0, count: 0 };
        }
        statsMap[cId].total += rating;
        statsMap[cId].count += 1;
      }
    }

    return data.map((row: any) => {
      const course = this.mapToCourse(row);
      const stats = statsMap[course.id] || { total: 0, count: 0 };
      const ratingAverage = stats.count > 0 ? Number((stats.total / stats.count).toFixed(1)) : 0;
      const ratingCount = stats.count;
      return {
        ...course,
        ratingAverage,
        ratingCount,
      } as any;
    });
  }

  async update(course: Course): Promise<Course> {
    const { data, error } = await this.client
      .from('courses')
      .update({
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        is_published: course.isPublished,
        price: course.price,
      })
      .eq('id', course.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCourse(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async save(course: Course): Promise<Course> {
    return this.update(course);
  }

  async enrollUser(courseId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('enrollments')
      .insert({ course_id: courseId, user_id: userId });

    if (error) {
      // Mã lỗi 23505 là Unique Violation (Người dùng đã đăng ký khóa này rồi)
      if (error.code === '23505') return; 
      throw error;
    }
  }

  async checkEnrollment(courseId: string, userId: string): Promise<boolean> {
    const supabase = (this as any).adminClient || this.client;
    const { data, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async getEnrolledCourses(userId: string): Promise<Course[]> {
    // Dùng adminClient để vượt qua RLS
    const supabase = (this as any).adminClient || this.client;
    
    // JOIN bảng enrollments với bảng courses
    const { data, error } = await supabase
      .from('enrollments')
      .select('courses(*)')
      .eq('user_id', userId);

    if (error) throw error;
    if (!data) return [];
    
    // Fetch approved reviews to calculate aggregates
    const { data: reviews, error: reviewsError } = await this.client
      .from('course_reviews')
      .select('course_id, rating')
      .eq('status', 'approved');

    const statsMap: Record<string, { total: number; count: number }> = {};
    if (reviews && !reviewsError) {
      for (const r of reviews) {
        const cId = r.course_id;
        const rating = Number(r.rating);
        if (!statsMap[cId]) {
          statsMap[cId] = { total: 0, count: 0 };
        }
        statsMap[cId].total += rating;
        statsMap[cId].count += 1;
      }
    }

    // Bóc tách dữ liệu và map sang dạng Course Model
    return data
      .map((row: any) => row.courses)
      .filter((course: any) => course !== null)
      .map((course: any) => {
        const mapped = this.mapToCourse(course);
        const stats = statsMap[mapped.id] || { total: 0, count: 0 };
        const ratingAverage = stats.count > 0 ? Number((stats.total / stats.count).toFixed(1)) : 0;
        const ratingCount = stats.count;
        return {
          ...mapped,
          ratingAverage,
          ratingCount,
        } as any;
      });
  }
}

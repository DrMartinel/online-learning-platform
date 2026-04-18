import { SupabaseClient } from '@supabase/supabase-js';
import { Course } from '../../../domain/entities/Course';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { ListCoursesFilterDTO } from '../../../application/dtos/CourseDTOs';
import { CourseNotFoundError } from '../../../domain/errors/CourseErrors';

export class SupabaseCourseRepository implements ICourseRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  public async create(course: Course): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .insert({
        id: course.id,
        instructor_id: course.instructorId,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        is_published: course.isPublished,
        created_at: course.createdAt
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create course: ${error?.message}`);
    }

    return this.mapToCourse(data);
  }

  public async findById(id: string): Promise<Course | null> {
    const { data, error } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find course: ${error.message}`);
    }

    return data ? this.mapToCourse(data) : null;
  }

  public async findAll(filter?: ListCoursesFilterDTO): Promise<Course[]> {
    let query = this.supabase.from('courses').select('*');

    if (filter?.published !== undefined) {
      query = query.eq('is_published', filter.published);
    }

    if (filter?.instructorId) {
      query = query.eq('instructor_id', filter.instructorId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    return data ? data.map(item => this.mapToCourse(item)) : [];
  }

  public async update(course: Course): Promise<Course> {
    const { data, error } = await this.supabase
      .from('courses')
      .update({
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        is_published: course.isPublished,
        updated_at: new Date()
      })
      .eq('id', course.id)
      .select()
      .single();

    if (error || !data) {
      throw new CourseNotFoundError(course.id);
    }

    return this.mapToCourse(data);
  }

  public async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }

  private mapToCourse(data: any): Course {
    return new Course(
      data.id,
      data.instructor_id,
      data.title,
      data.description,
      data.thumbnail_url,
      data.is_published,
      new Date(data.created_at),
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }
}

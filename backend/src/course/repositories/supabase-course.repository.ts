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
    return this.mapToCourse(data);
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

    return data.map(this.mapToCourse);
  }

  async update(course: Course): Promise<Course> {
    const { data, error } = await this.client
      .from('courses')
      .update({
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnailUrl,
        is_published: course.isPublished,
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
}

import { SupabaseClient } from '@supabase/supabase-js';
import { ICourseExamRepository } from '../repositories/ICourseExamRepository';
import { CourseExam } from '../entities/CourseExam';

export class SupabaseCourseExamRepository implements ICourseExamRepository {
  constructor(private client: SupabaseClient) {}

  async addExamsToCourse(courseId: string, examIds: string[]): Promise<void> {
    // Delete existing links first
    const { error: deleteError } = await this.client
      .from('course_exams')
      .delete()
      .eq('course_id', courseId);
    if (deleteError) throw deleteError;

    if (examIds.length > 0) {
      const inserts = examIds.map((examId) => ({
        course_id: courseId,
        exam_id: examId,
      }));
      const { error } = await this.client.from('course_exams').insert(inserts);
      if (error) throw error;
    }
  }

  async getExamsByCourse(courseId: string): Promise<CourseExam[]> {
    const { data, error } = await this.client
      .from('course_exams')
      .select('*')
      .eq('course_id', courseId);
    if (error) throw error;
    return (data || []).map((row: any) => new CourseExam(row.id, row.course_id, row.exam_id, new Date(row.created_at)));
  }
}

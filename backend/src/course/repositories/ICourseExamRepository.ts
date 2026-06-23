import { CourseExam } from '../entities/CourseExam';

export interface ICourseExamRepository {
  // Link exams to a course
  addExamsToCourse(courseId: string, examIds: string[]): Promise<void>;
  // Retrieve exams linked to a course
  getExamsByCourse(courseId: string): Promise<CourseExam[]>;
}

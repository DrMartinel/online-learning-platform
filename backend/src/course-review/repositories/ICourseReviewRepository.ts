import { CourseReview } from '../entities/CourseReview';

export interface ICourseReviewRepository {
  create(review: CourseReview): Promise<CourseReview>;
  findById(id: string): Promise<CourseReview | null>;
  findByUserAndCourse(userId: string, courseId: string): Promise<CourseReview | null>;
  findApprovedByCourse(courseId: string): Promise<any[]>;
  findAllAdmin(filters: { courseId?: string; rating?: number; status?: string }): Promise<any[]>;
  update(review: CourseReview): Promise<CourseReview>;
  delete(id: string): Promise<void>;
}

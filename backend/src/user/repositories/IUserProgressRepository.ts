export interface IUserProgressRepository {
  createOrUpdate(dto: any): Promise<any>;
  findByLesson(userId: string, lessonId: string): Promise<any | null>;
  findByCourse(userId: string, courseId: string): Promise<any[]>;
  /** Returns the total number of lessons in a course (not just those with progress rows). */
  countCourseLessons(courseId: string): Promise<number>;
}

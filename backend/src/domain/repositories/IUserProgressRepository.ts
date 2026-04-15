import { UserProgressDTO, CreateUserProgressDTO, UpdateUserProgressDTO } from '../../application/dtos/UserProgressDTOs';

export interface IUserProgressRepository {
  findByUserAndLesson(userId: string, lessonId: string): Promise<UserProgressDTO | null>;
  findByUserAndCourse(userId: string, courseId: string): Promise<UserProgressDTO[]>;
  findById(id: string): Promise<UserProgressDTO | null>;
  create(userId: string, dto: CreateUserProgressDTO): Promise<UserProgressDTO>;
  update(id: string, dto: UpdateUserProgressDTO): Promise<UserProgressDTO>;
  delete(id: string): Promise<void>;
  countCompletedLessonsInCourse(userId: string, courseId: string): Promise<number>;
  countTotalLessonsInCourse(courseId: string): Promise<number>;
}

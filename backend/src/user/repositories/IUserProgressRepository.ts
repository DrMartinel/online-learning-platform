import { UserProgressResponseDTO, CreateUserProgressDTO, UpdateUserProgressDTO } from '../dto/user-progress.dto';

export interface IUserProgressRepository {
  createOrUpdate(dto: any): Promise<any>;
  findByLesson(userId: string, lessonId: string): Promise<any | null>;
  findByCourse(userId: string, courseId: string): Promise<any[]>;
}

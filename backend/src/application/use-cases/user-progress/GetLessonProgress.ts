import { UserProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';

export class GetLessonProgressUseCase {
  constructor(private readonly repository: IUserProgressRepository) {}

  async execute(userId: string, lessonId: string): Promise<UserProgressDTO | null> {
    return this.repository.findByUserAndLesson(userId, lessonId);
  }
}

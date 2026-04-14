import { CreateUserProgressDTO, UserProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';

export class CreateUserProgressUseCase {
  constructor(private readonly repository: IUserProgressRepository) {}

  async execute(userId: string, dto: CreateUserProgressDTO): Promise<UserProgressDTO> {
    const existing = await this.repository.findByUserAndLesson(userId, dto.lessonId);
    if (existing) {
      return this.repository.update(existing.id, { completed: dto.completed });
    }
    return this.repository.create(userId, dto);
  }
}

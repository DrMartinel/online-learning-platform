import { UpdateUserProgressDTO, UserProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';

export class UpdateProgressUseCase {
  constructor(private readonly repository: IUserProgressRepository) {}

  async execute(id: string, dto: UpdateUserProgressDTO): Promise<UserProgressDTO> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Progress record with ID ${id} not found`);
    }
    return this.repository.update(id, dto);
  }
}

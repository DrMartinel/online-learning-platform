import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';

export class DeleteProgressUseCase {
  constructor(private readonly repository: IUserProgressRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error(`Progress record with ID ${id} not found`);
    }
    await this.repository.delete(id);
  }
}

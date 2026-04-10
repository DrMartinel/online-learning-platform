import { IUserRepository } from '../../../domain/repositories/UserRepository';
import { UserNotFoundError } from '../../../domain/errors/UserErrors';
import { UserProfileDTO } from '../../dtos/UserDTOs';

export class GetUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(userId: string): Promise<UserProfileDTO> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

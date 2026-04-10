import { IUserRepository } from '../../../domain/repositories/UserRepository';
import { UserNotFoundError } from '../../../domain/errors/UserErrors';
import { UpdateUserProfileDTO, UserProfileDTO } from '../../dtos/UserDTOs';

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(dto: UpdateUserProfileDTO): Promise<UserProfileDTO> {
    if (!dto.id) {
      throw new Error('User ID is required');
    }

    const user = await this.userRepository.findById(dto.id);

    if (!user) {
      throw new UserNotFoundError(dto.id);
    }

    if (dto.fullName !== undefined) {
      user.updateFullName(dto.fullName);
    }

    await this.userRepository.update(user);

    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

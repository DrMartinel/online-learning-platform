import { IUserRepository } from '../../../domain/repositories/UserRepository';
import { UpdateUserProfileDTO, UserProfileDTO } from '../../dtos/UserDTOs';
export declare class UpdateUserProfileUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(dto: UpdateUserProfileDTO): Promise<UserProfileDTO>;
}
//# sourceMappingURL=UpdateUserProfile.d.ts.map
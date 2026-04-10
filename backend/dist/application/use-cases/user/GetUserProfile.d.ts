import { IUserRepository } from '../../../domain/repositories/UserRepository';
import { UserProfileDTO } from '../../dtos/UserDTOs';
export declare class GetUserProfileUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string): Promise<UserProfileDTO>;
}
//# sourceMappingURL=GetUserProfile.d.ts.map
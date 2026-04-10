import { SupabaseClient } from '@supabase/supabase-js';
import { GetUserProfileUseCase } from '../../application/use-cases/user/GetUserProfile';
import { UpdateUserProfileUseCase } from '../../application/use-cases/user/UpdateUserProfile';
import { SupabaseUserRepository } from '../../infrastructure/supabase/repositories/SupabaseUserRepository';
import { UpdateUserProfileDTO, UserProfileDTO } from '../../application/dtos/UserDTOs';

/**
 * Acts as the Facade/Controller for the User domain.
 * The consuming application (like Next.js) instantiates this 
 * by passing its configured SupabaseClient (with appropriate auth context).
 */
export class UserController {
  private getUserProfile: GetUserProfileUseCase;
  private updateUserProfile: UpdateUserProfileUseCase;

  constructor(supabaseClient: SupabaseClient) {
    const userRepository = new SupabaseUserRepository(supabaseClient);
    this.getUserProfile = new GetUserProfileUseCase(userRepository);
    this.updateUserProfile = new UpdateUserProfileUseCase(userRepository);
  }

  public async getProfile(userId: string): Promise<UserProfileDTO> {
    return this.getUserProfile.execute(userId);
  }

  public async updateProfile(dto: UpdateUserProfileDTO): Promise<UserProfileDTO> {
    return this.updateUserProfile.execute(dto);
  }
}

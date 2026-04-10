import { SupabaseClient } from '@supabase/supabase-js';
import { UpdateUserProfileDTO, UserProfileDTO } from '../../application/dtos/UserDTOs';
/**
 * Acts as the Facade/Controller for the User domain.
 * The consuming application (like Next.js) instantiates this
 * by passing its configured SupabaseClient (with appropriate auth context).
 */
export declare class UserController {
    private getUserProfile;
    private updateUserProfile;
    constructor(supabaseClient: SupabaseClient);
    getProfile(userId: string): Promise<UserProfileDTO>;
    updateProfile(dto: UpdateUserProfileDTO): Promise<UserProfileDTO>;
}
//# sourceMappingURL=UserController.d.ts.map
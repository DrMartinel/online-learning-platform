import { SupabaseClient } from '@supabase/supabase-js';
import { SignUpDTO, SignInDTO, AuthResultDTO } from '../../application/dtos/AuthDTOs';
export declare class AuthController {
    private signUpUseCase;
    private signInUseCase;
    private signOutUseCase;
    constructor(supabaseClient: SupabaseClient);
    signUp(dto: SignUpDTO): Promise<AuthResultDTO>;
    signIn(dto: SignInDTO): Promise<AuthResultDTO>;
    signOut(): Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map
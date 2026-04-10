import { SupabaseClient } from '@supabase/supabase-js';
import { IAuthRepository, ISignUpOptions, ISignInOptions } from '../../../domain/repositories/IAuthRepository';
import { AuthSession } from '../../../domain/entities/AuthSession';
export declare class SupabaseAuthRepository implements IAuthRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    signUp(options: ISignUpOptions): Promise<AuthSession>;
    signIn(options: ISignInOptions): Promise<AuthSession>;
    signOut(): Promise<void>;
}
//# sourceMappingURL=SupabaseAuthRepository.d.ts.map
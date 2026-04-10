import { SupabaseClient } from '@supabase/supabase-js';
import { User } from '../../../domain/entities/User';
import { IUserRepository } from '../../../domain/repositories/UserRepository';
export declare class SupabaseUserRepository implements IUserRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    findById(id: string): Promise<User | null>;
    update(user: User): Promise<void>;
}
//# sourceMappingURL=SupabaseUserRepository.d.ts.map
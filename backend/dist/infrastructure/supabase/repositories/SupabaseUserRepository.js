"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseUserRepository = void 0;
const User_1 = require("../../../domain/entities/User");
class SupabaseUserRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findById(id) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data)
            return null;
        return new User_1.User(data.id, data.full_name, data.role, new Date(data.created_at));
    }
    async update(user) {
        const { error } = await this.supabase
            .from('profiles')
            .update({
            full_name: user.fullName,
        })
            .eq('id', user.id);
        if (error) {
            throw new Error(`Failed to update user profile: ${error.message}`);
        }
    }
}
exports.SupabaseUserRepository = SupabaseUserRepository;

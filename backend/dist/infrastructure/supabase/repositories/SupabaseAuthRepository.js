"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuthRepository = void 0;
const AuthSession_1 = require("../../../domain/entities/AuthSession");
const AuthErrors_1 = require("../../../domain/errors/AuthErrors");
class SupabaseAuthRepository {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async signUp(options) {
        const { data: { session, user }, error } = await this.supabase.auth.signUp({
            email: options.email,
            password: options.password || '', // Password may be required depending on Supabase settings
            options: {
                data: {
                    full_name: options.fullName
                }
            }
        });
        if (error) {
            if (error.message.includes('already registered')) {
                throw new AuthErrors_1.UserAlreadyExistsError(error.message);
            }
            throw new AuthErrors_1.AuthenticationError(error.message);
        }
        if (!session || !user) {
            throw new AuthErrors_1.AuthenticationError('Sign up successful, but no session returned (possibly requires email confirmation)');
        }
        return new AuthSession_1.AuthSession(session.access_token, session.refresh_token, user.id, user.user_metadata?.role || 'student', // Postgres trigger handles role, default student
        session.expires_at);
    }
    async signIn(options) {
        const { data: { session, user }, error } = await this.supabase.auth.signInWithPassword({
            email: options.email,
            password: options.password || ''
        });
        if (error) {
            throw new AuthErrors_1.AuthenticationError(error.message);
        }
        if (!session || !user) {
            throw new AuthErrors_1.AuthenticationError('Invalid session returned');
        }
        return new AuthSession_1.AuthSession(session.access_token, session.refresh_token, user.id, user.user_metadata?.role || 'student', session.expires_at);
    }
    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            throw new AuthErrors_1.AuthenticationError(error.message);
        }
    }
}
exports.SupabaseAuthRepository = SupabaseAuthRepository;

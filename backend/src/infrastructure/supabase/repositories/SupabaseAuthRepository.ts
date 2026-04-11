import { SupabaseClient } from '@supabase/supabase-js';
import { IAuthRepository, ISignUpOptions, ISignInOptions } from '../../../domain/repositories/IAuthRepository';
import { AuthSession } from '../../../domain/entities/AuthSession';
import { AuthenticationError, UserAlreadyExistsError } from '../../../domain/errors/AuthErrors';

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly supabase: SupabaseClient) { }

  public async signUp(options: ISignUpOptions): Promise<AuthSession> {
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
        throw new UserAlreadyExistsError(error.message);
      }
      throw new AuthenticationError(error.message);
    }

    if (!session || !user) {
      throw new AuthenticationError('Sign up successful, but no session returned (possibly requires email confirmation)');
    }

    return new AuthSession(
      session.access_token,
      session.refresh_token,
      user.id,
      user.user_metadata?.role || 'student', // Postgres trigger handles role, default student
      session.expires_at
    );
  }

  public async signIn(options: ISignInOptions): Promise<AuthSession> {
    const { data: { session, user }, error } = await this.supabase.auth.signInWithPassword({
      email: options.email,
      password: options.password || ''
    });

    if (error) {
      throw new AuthenticationError(error.message);
    }

    if (!session || !user) {
      throw new AuthenticationError('Invalid session returned');
    }

    return new AuthSession(
      session.access_token,
      session.refresh_token,
      user.id,
      user.user_metadata?.role || 'student',
      session.expires_at
    );
  }

  public async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new AuthenticationError(error.message);
    }
  }
}

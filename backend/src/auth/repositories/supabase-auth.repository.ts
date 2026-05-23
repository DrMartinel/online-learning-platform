import { SupabaseClient } from '@supabase/supabase-js';
import { IAuthRepository } from './IAuthRepository';
import { SignInDTO, SignUpDTO } from '../dto/auth.dto';
import { AuthSession } from '../entities/AuthSession';
import { AuthenticationError, UserAlreadyExistsError } from '../AuthErrors';

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private client: SupabaseClient) {}

  async signUp(dto: SignUpDTO): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signUp({
      email: dto.email,
      password: dto.password || '', // Supabase might require a password; ensure front-end provides it if needed
      options: {
        data: {
          full_name: dto.fullName,
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new UserAlreadyExistsError(dto.email);
      }
      throw new AuthenticationError(error.message);
    }

    if (!data.session) {
      throw new AuthenticationError('Sign up successful, but no session returned. Email confirmation might be required.');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      userId: data.user!.id,
      role: data.user!.user_metadata?.role || 'student',
      expiresAt: data.session.expires_at,
    };
  }

  async signIn(dto: SignInDTO): Promise<AuthSession> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password || '',
    });

    if (error) {
      throw new AuthenticationError(error.message);
    }

    if (!data.session) {
      throw new AuthenticationError('Sign in successful, but no session returned.');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      userId: data.user!.id,
      role: data.user!.user_metadata?.role || 'student',
      expiresAt: data.session.expires_at,
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) {
      throw new AuthenticationError(`Sign out failed: ${error.message}`);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const { data: { session }, error } = await this.client.auth.getSession();
    
    if (error) {
       throw new AuthenticationError(error.message);
    }

    if (!session) return null;

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      userId: session.user.id,
      role: session.user.user_metadata?.role || 'student',
      expiresAt: session.expires_at,
    };
  }
}

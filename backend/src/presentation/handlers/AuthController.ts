import { SupabaseClient } from '@supabase/supabase-js';
import { SignUpUseCase } from '../../application/use-cases/auth/SignUp';
import { SignInUseCase } from '../../application/use-cases/auth/SignIn';
import { SignOutUseCase } from '../../application/use-cases/auth/SignOut';
import { SupabaseAuthRepository } from '../../infrastructure/supabase/repositories/SupabaseAuthRepository';
import { SignUpDTO, SignInDTO, AuthResultDTO } from '../../application/dtos/AuthDTOs';

export class AuthController {
  private signUpUseCase: SignUpUseCase;
  private signInUseCase: SignInUseCase;
  private signOutUseCase: SignOutUseCase;

  constructor(supabaseClient: SupabaseClient) {
    const authRepository = new SupabaseAuthRepository(supabaseClient);
    this.signUpUseCase = new SignUpUseCase(authRepository);
    this.signInUseCase = new SignInUseCase(authRepository);
    this.signOutUseCase = new SignOutUseCase(authRepository);
  }

  public async signUp(dto: SignUpDTO): Promise<AuthResultDTO> {
    return this.signUpUseCase.execute(dto);
  }

  public async signIn(dto: SignInDTO): Promise<AuthResultDTO> {
    return this.signInUseCase.execute(dto);
  }

  public async signOut(): Promise<void> {
    return this.signOutUseCase.execute();
  }
}

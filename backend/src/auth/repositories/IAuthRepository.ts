import { SignInDTO, SignUpDTO } from '../dto/auth.dto';
import { AuthSession } from '../entities/AuthSession';

export interface IAuthRepository {
  signUp(dto: SignUpDTO): Promise<AuthSession>;
  signIn(dto: SignInDTO): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
}

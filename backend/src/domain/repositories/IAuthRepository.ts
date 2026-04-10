import { AuthSession } from '../entities/AuthSession';

export interface ISignUpOptions {
  email: string;
  password?: string;
  fullName: string;
}

export interface ISignInOptions {
  email: string;
  password?: string;
}

export interface IAuthRepository {
  signUp(options: ISignUpOptions): Promise<AuthSession>;
  signIn(options: ISignInOptions): Promise<AuthSession>;
  signOut(): Promise<void>;
}

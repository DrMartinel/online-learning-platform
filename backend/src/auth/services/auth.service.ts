import { Inject, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { SignInDTO, SignUpDTO, AuthResultDTO } from '../dto/auth.dto';
import { AuthSession } from '../entities/AuthSession';
import { AuthenticationError, UserAlreadyExistsError } from '../AuthErrors';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepo: IAuthRepository,
  ) {}

  async signUp(dto: SignUpDTO): Promise<AuthResultDTO> {
    try {
      const session = await this.authRepo.signUp(dto);
      return this.mapToResponse(session);
    } catch (error: any) {
      if (error instanceof UserAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      throw new UnauthorizedException(error.message);
    }
  }

  async signIn(dto: SignInDTO): Promise<AuthResultDTO> {
    try {
      const session = await this.authRepo.signIn(dto);
      return this.mapToResponse(session);
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.authRepo.signOut();
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  private mapToResponse(session: AuthSession): AuthResultDTO {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: session.userId,
      role: session.role,
      expiresAt: session.expiresAt,
    };
  }
}

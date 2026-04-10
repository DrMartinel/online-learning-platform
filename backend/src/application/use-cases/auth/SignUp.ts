import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
import { AuthenticationError } from '../../../domain/errors/AuthErrors';
import { SignUpDTO, AuthResultDTO } from '../../dtos/AuthDTOs';

export class SignUpUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  public async execute(dto: SignUpDTO): Promise<AuthResultDTO> {
    if (!dto.email) {
      throw new AuthenticationError('Email is required for sign up');
    }

    if (!dto.fullName || dto.fullName.trim().length === 0) {
      throw new AuthenticationError('Full name is required for sign up');
    }

    const session = await this.authRepository.signUp({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName
    });

    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: session.userId,
      role: session.role,
      expiresAt: session.expiresAt
    };
  }
}

import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
import { AuthenticationError } from '../../../domain/errors/AuthErrors';
import { SignInDTO, AuthResultDTO } from '../../dtos/AuthDTOs';

export class SignInUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  public async execute(dto: SignInDTO): Promise<AuthResultDTO> {
    if (!dto.email) {
      throw new AuthenticationError('Email is required for sign in');
    }

    const session = await this.authRepository.signIn({
      email: dto.email,
      password: dto.password
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

import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';

export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  public async execute(): Promise<void> {
    await this.authRepository.signOut();
  }
}

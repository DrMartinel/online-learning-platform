import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
import { SignInDTO, AuthResultDTO } from '../../dtos/AuthDTOs';
export declare class SignInUseCase {
    private readonly authRepository;
    constructor(authRepository: IAuthRepository);
    execute(dto: SignInDTO): Promise<AuthResultDTO>;
}
//# sourceMappingURL=SignIn.d.ts.map
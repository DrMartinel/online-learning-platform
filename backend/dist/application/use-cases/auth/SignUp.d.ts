import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
import { SignUpDTO, AuthResultDTO } from '../../dtos/AuthDTOs';
export declare class SignUpUseCase {
    private readonly authRepository;
    constructor(authRepository: IAuthRepository);
    execute(dto: SignUpDTO): Promise<AuthResultDTO>;
}
//# sourceMappingURL=SignUp.d.ts.map
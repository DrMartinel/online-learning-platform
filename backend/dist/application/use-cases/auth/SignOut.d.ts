import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';
export declare class SignOutUseCase {
    private readonly authRepository;
    constructor(authRepository: IAuthRepository);
    execute(): Promise<void>;
}
//# sourceMappingURL=SignOut.d.ts.map
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';
export declare class DeleteProgressUseCase {
    private readonly repository;
    constructor(repository: IUserProgressRepository);
    execute(id: string): Promise<void>;
}
//# sourceMappingURL=DeleteProgress.d.ts.map
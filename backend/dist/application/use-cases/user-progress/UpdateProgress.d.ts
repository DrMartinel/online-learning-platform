import { UpdateUserProgressDTO, UserProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';
export declare class UpdateProgressUseCase {
    private readonly repository;
    constructor(repository: IUserProgressRepository);
    execute(id: string, dto: UpdateUserProgressDTO): Promise<UserProgressDTO>;
}
//# sourceMappingURL=UpdateProgress.d.ts.map
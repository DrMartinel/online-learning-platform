import { CreateUserProgressDTO, UserProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';
export declare class CreateUserProgressUseCase {
    private readonly repository;
    constructor(repository: IUserProgressRepository);
    execute(userId: string, dto: CreateUserProgressDTO): Promise<UserProgressDTO>;
}
//# sourceMappingURL=CreateUserProgress.d.ts.map
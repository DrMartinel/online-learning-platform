import { UserProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';
export declare class GetLessonProgressUseCase {
    private readonly repository;
    constructor(repository: IUserProgressRepository);
    execute(userId: string, lessonId: string): Promise<UserProgressDTO | null>;
}
//# sourceMappingURL=GetLessonProgress.d.ts.map
import { CourseProgressDTO } from '../../dtos/UserProgressDTOs';
import { IUserProgressRepository } from '../../../domain/repositories/IUserProgressRepository';
export declare class GetCourseProgressUseCase {
    private readonly repository;
    constructor(repository: IUserProgressRepository);
    execute(userId: string, courseId: string): Promise<CourseProgressDTO>;
}
//# sourceMappingURL=GetCourseProgress.d.ts.map
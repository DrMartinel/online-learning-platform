import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
export declare class DeleteCourseUseCase {
    private readonly courseRepository;
    constructor(courseRepository: ICourseRepository);
    execute(id: string): Promise<void>;
}
//# sourceMappingURL=DeleteCourse.d.ts.map
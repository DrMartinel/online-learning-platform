import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { CourseResponseDTO } from '../../dtos/CourseDTOs';
export declare class FindCourseByIdUseCase {
    private readonly courseRepository;
    constructor(courseRepository: ICourseRepository);
    execute(id: string): Promise<CourseResponseDTO>;
}
//# sourceMappingURL=FindCourseById.d.ts.map
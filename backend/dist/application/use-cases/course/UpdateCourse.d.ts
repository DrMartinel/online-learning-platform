import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { UpdateCourseDTO, CourseResponseDTO } from '../../dtos/CourseDTOs';
export declare class UpdateCourseUseCase {
    private readonly courseRepository;
    constructor(courseRepository: ICourseRepository);
    execute(dto: UpdateCourseDTO): Promise<CourseResponseDTO>;
}
//# sourceMappingURL=UpdateCourse.d.ts.map
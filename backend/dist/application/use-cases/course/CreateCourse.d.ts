import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { CreateCourseDTO, CourseResponseDTO } from '../../dtos/CourseDTOs';
export declare class CreateCourseUseCase {
    private readonly courseRepository;
    constructor(courseRepository: ICourseRepository);
    execute(instructorId: string, dto: CreateCourseDTO): Promise<CourseResponseDTO>;
    private mapToDTO;
}
//# sourceMappingURL=CreateCourse.d.ts.map
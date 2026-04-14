import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { ListCoursesFilterDTO, CourseResponseDTO } from '../../dtos/CourseDTOs';
export declare class ListCoursesUseCase {
    private readonly courseRepository;
    constructor(courseRepository: ICourseRepository);
    execute(filter?: ListCoursesFilterDTO): Promise<CourseResponseDTO[]>;
}
//# sourceMappingURL=ListCourses.d.ts.map
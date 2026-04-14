import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { LessonDTO } from '../../dtos/LessonDTOs';
export declare class GetLessonsByCourseUseCase {
    private readonly lessonRepository;
    constructor(lessonRepository: LessonRepository);
    execute(courseId: string): Promise<LessonDTO[]>;
}
//# sourceMappingURL=GetLessonsByCourse.d.ts.map
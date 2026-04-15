import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { CreateLessonRequestDTO, LessonDTO } from '../../dtos/LessonDTOs';
export declare class CreateLessonUseCase {
    private readonly lessonRepository;
    constructor(lessonRepository: LessonRepository);
    execute(dto: CreateLessonRequestDTO): Promise<LessonDTO>;
}
//# sourceMappingURL=CreateLesson.d.ts.map
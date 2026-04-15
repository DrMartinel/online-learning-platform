import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { UpdateLessonRequestDTO, LessonDTO } from '../../dtos/LessonDTOs';
export declare class UpdateLessonUseCase {
    private readonly lessonRepository;
    constructor(lessonRepository: LessonRepository);
    execute(id: string, dto: UpdateLessonRequestDTO): Promise<LessonDTO>;
}
//# sourceMappingURL=UpdateLesson.d.ts.map
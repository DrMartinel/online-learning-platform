import { LessonRepository } from '../../../domain/repositories/LessonRepository';
import { LessonDTO } from '../../dtos/LessonDTOs';
export declare class GetLessonByIdUseCase {
    private readonly lessonRepository;
    constructor(lessonRepository: LessonRepository);
    execute(id: string): Promise<LessonDTO>;
}
//# sourceMappingURL=GetLessonById.d.ts.map
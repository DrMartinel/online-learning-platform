import { LessonRepository } from '../../../domain/repositories/LessonRepository';
export declare class DeleteLessonUseCase {
    private readonly lessonRepository;
    constructor(lessonRepository: LessonRepository);
    execute(id: string): Promise<void>;
}
//# sourceMappingURL=DeleteLesson.d.ts.map
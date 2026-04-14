import { SupabaseClient } from '@supabase/supabase-js';
import { CreateLessonRequestDTO, UpdateLessonRequestDTO, LessonDTO } from '../../application/dtos/LessonDTOs';
export declare class LessonController {
    private createLesson;
    private getLessonsByCourse;
    private getLessonById;
    private updateLesson;
    private deleteLesson;
    constructor(supabaseClient: SupabaseClient);
    handleCreate(dto: CreateLessonRequestDTO): Promise<LessonDTO>;
    handleGetByCourse(courseId: string): Promise<LessonDTO[]>;
    handleGetById(id: string): Promise<LessonDTO>;
    handleUpdate(id: string, dto: UpdateLessonRequestDTO): Promise<LessonDTO>;
    handleDelete(id: string): Promise<void>;
}
//# sourceMappingURL=LessonController.d.ts.map
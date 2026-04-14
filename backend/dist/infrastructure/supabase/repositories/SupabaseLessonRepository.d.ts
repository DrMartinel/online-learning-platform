import { SupabaseClient } from '@supabase/supabase-js';
import { Lesson } from '../../../domain/entities/Lesson';
import { LessonRepository } from '../../../domain/repositories/LessonRepository';
export declare class SupabaseLessonRepository implements LessonRepository {
    private client;
    constructor(client: SupabaseClient);
    private mapToLesson;
    create(lesson: Omit<Lesson, 'id' | 'createdAt'>): Promise<Lesson>;
    findById(id: string): Promise<Lesson | null>;
    findByCourseId(courseId: string): Promise<Lesson[]>;
    update(id: string, lesson: Partial<Omit<Lesson, 'id' | 'courseId' | 'createdAt'>>): Promise<Lesson | null>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=SupabaseLessonRepository.d.ts.map
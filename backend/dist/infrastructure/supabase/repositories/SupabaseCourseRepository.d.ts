import { SupabaseClient } from '@supabase/supabase-js';
import { Course } from '../../../domain/entities/Course';
import { ICourseRepository } from '../../../domain/repositories/ICourseRepository';
import { ListCoursesFilterDTO } from '../../../application/dtos/CourseDTOs';
export declare class SupabaseCourseRepository implements ICourseRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    create(course: Course): Promise<Course>;
    findById(id: string): Promise<Course | null>;
    findAll(filter?: ListCoursesFilterDTO): Promise<Course[]>;
    update(course: Course): Promise<Course>;
    delete(id: string): Promise<void>;
    private mapToCourse;
}
//# sourceMappingURL=SupabaseCourseRepository.d.ts.map
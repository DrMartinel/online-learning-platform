import { SupabaseClient } from '@supabase/supabase-js';
import { CreateCourseDTO, UpdateCourseDTO, ListCoursesFilterDTO, CourseResponseDTO } from '../../application/dtos/CourseDTOs';
export declare class CourseController {
    private createCourseUseCase;
    private findCourseByIdUseCase;
    private listCoursesUseCase;
    private updateCourseUseCase;
    private deleteCourseUseCase;
    constructor(supabaseClient: SupabaseClient);
    /**
     * Create a new course
     * POST /api/courses
     */
    create(instructorId: string, dto: CreateCourseDTO): Promise<CourseResponseDTO>;
    /**
     * Get a course by ID
     * GET /api/courses/:id
     */
    getById(id: string): Promise<CourseResponseDTO>;
    /**
     * List all courses with optional filters
     * GET /api/courses
     */
    list(filter?: ListCoursesFilterDTO): Promise<CourseResponseDTO[]>;
    /**
     * Update a course
     * PUT /api/courses/:id
     */
    update(dto: UpdateCourseDTO): Promise<CourseResponseDTO>;
    /**
     * Delete a course
     * DELETE /api/courses/:id
     */
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=CourseController.d.ts.map
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateCourseUseCase } from '../../application/use-cases/course/CreateCourse';
import { FindCourseByIdUseCase } from '../../application/use-cases/course/FindCourseById';
import { ListCoursesUseCase } from '../../application/use-cases/course/ListCourses';
import { UpdateCourseUseCase } from '../../application/use-cases/course/UpdateCourse';
import { DeleteCourseUseCase } from '../../application/use-cases/course/DeleteCourse';
import { SupabaseCourseRepository } from '../../infrastructure/supabase/repositories/SupabaseCourseRepository';
import { CreateCourseDTO, UpdateCourseDTO, ListCoursesFilterDTO, CourseResponseDTO } from '../../application/dtos/CourseDTOs';

export class CourseController {
  private createCourseUseCase: CreateCourseUseCase;
  private findCourseByIdUseCase: FindCourseByIdUseCase;
  private listCoursesUseCase: ListCoursesUseCase;
  private updateCourseUseCase: UpdateCourseUseCase;
  private deleteCourseUseCase: DeleteCourseUseCase;

  constructor(supabaseClient: SupabaseClient) {
    const courseRepository = new SupabaseCourseRepository(supabaseClient);
    this.createCourseUseCase = new CreateCourseUseCase(courseRepository);
    this.findCourseByIdUseCase = new FindCourseByIdUseCase(courseRepository);
    this.listCoursesUseCase = new ListCoursesUseCase(courseRepository);
    this.updateCourseUseCase = new UpdateCourseUseCase(courseRepository);
    this.deleteCourseUseCase = new DeleteCourseUseCase(courseRepository);
  }

  /**
   * Create a new course
   * POST /api/courses
   */
  public async create(instructorId: string, dto: CreateCourseDTO): Promise<CourseResponseDTO> {
    return this.createCourseUseCase.execute(instructorId, dto);
  }

  /**
   * Get a course by ID
   * GET /api/courses/:id
   */
  public async getById(id: string): Promise<CourseResponseDTO> {
    return this.findCourseByIdUseCase.execute(id);
  }

  /**
   * List all courses with optional filters
   * GET /api/courses
   */
  public async list(filter?: ListCoursesFilterDTO): Promise<CourseResponseDTO[]> {
    return this.listCoursesUseCase.execute(filter);
  }

  /**
   * Update a course
   * PUT /api/courses/:id
   */
  public async update(dto: UpdateCourseDTO): Promise<CourseResponseDTO> {
    return this.updateCourseUseCase.execute(dto);
  }

  /**
   * Delete a course
   * DELETE /api/courses/:id
   */
  public async delete(id: string): Promise<void> {
    return this.deleteCourseUseCase.execute(id);
  }
}

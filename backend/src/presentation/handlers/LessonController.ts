import { SupabaseClient } from '@supabase/supabase-js';
import { CreateLessonUseCase } from '../../application/use-cases/lesson/CreateLesson';
import { GetLessonsByCourseUseCase } from '../../application/use-cases/lesson/GetLessonsByCourse';
import { GetLessonByIdUseCase } from '../../application/use-cases/lesson/GetLessonById';
import { UpdateLessonUseCase } from '../../application/use-cases/lesson/UpdateLesson';
import { DeleteLessonUseCase } from '../../application/use-cases/lesson/DeleteLesson';
import { SupabaseLessonRepository } from '../../infrastructure/supabase/repositories/SupabaseLessonRepository';
import { CreateLessonRequestDTO, UpdateLessonRequestDTO, LessonDTO } from '../../application/dtos/LessonDTOs';

export class LessonController {
  private createLesson: CreateLessonUseCase;
  private getLessonsByCourse: GetLessonsByCourseUseCase;
  private getLessonById: GetLessonByIdUseCase;
  private updateLesson: UpdateLessonUseCase;
  private deleteLesson: DeleteLessonUseCase;

  constructor(supabaseClient: SupabaseClient) {
    const lessonRepository = new SupabaseLessonRepository(supabaseClient);
    this.createLesson = new CreateLessonUseCase(lessonRepository);
    this.getLessonsByCourse = new GetLessonsByCourseUseCase(lessonRepository);
    this.getLessonById = new GetLessonByIdUseCase(lessonRepository);
    this.updateLesson = new UpdateLessonUseCase(lessonRepository);
    this.deleteLesson = new DeleteLessonUseCase(lessonRepository);
  }

  public async handleCreate(dto: CreateLessonRequestDTO): Promise<LessonDTO> {
    return this.createLesson.execute(dto);
  }

  public async handleGetByCourse(courseId: string): Promise<LessonDTO[]> {
    return this.getLessonsByCourse.execute(courseId);
  }

  public async handleGetById(id: string): Promise<LessonDTO> {
    return this.getLessonById.execute(id);
  }

  public async handleUpdate(id: string, dto: UpdateLessonRequestDTO): Promise<LessonDTO> {
    return this.updateLesson.execute(id, dto);
  }

  public async handleDelete(id: string): Promise<void> {
    return this.deleteLesson.execute(id);
  }
}

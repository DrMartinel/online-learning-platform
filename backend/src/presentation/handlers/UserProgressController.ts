import { FastifyReply, FastifyRequest } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseUserProgressRepository } from '../../infrastructure/supabase/repositories/SupabaseUserProgressRepository';
import { GetCourseProgressUseCase } from '../../application/use-cases/user-progress/GetCourseProgress';
import { GetLessonProgressUseCase } from '../../application/use-cases/user-progress/GetLessonProgress';
import { CreateUserProgressUseCase } from '../../application/use-cases/user-progress/CreateUserProgress';
import { UpdateProgressUseCase } from '../../application/use-cases/user-progress/UpdateProgress';
import { DeleteProgressUseCase } from '../../application/use-cases/user-progress/DeleteProgress';
import { CreateUserProgressDTO, UpdateUserProgressDTO } from '../../application/dtos/UserProgressDTOs';

export class UserProgressController {
  private repository: SupabaseUserProgressRepository;

  constructor(private readonly supabase: SupabaseClient) {
    this.repository = new SupabaseUserProgressRepository(supabase);
  }

  private async getUserId(): Promise<string> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Unauthorized');
    }
    return user.id;
  }

  async getCourseProgress(
    request: FastifyRequest<{ Params: { courseId: string } }>,
    reply: FastifyReply
  ) {
    const userId = await this.getUserId();
    const { courseId } = request.params;
    const useCase = new GetCourseProgressUseCase(this.repository);
    const result = await useCase.execute(userId, courseId);
    return reply.send(result);
  }

  async getLessonProgress(
    request: FastifyRequest<{ Params: { lessonId: string } }>,
    reply: FastifyReply
  ) {
    const userId = await this.getUserId();
    const { lessonId } = request.params;
    const useCase = new GetLessonProgressUseCase(this.repository);
    const result = await useCase.execute(userId, lessonId);
    if (!result) {
      return reply.code(404).send({ error: 'Progress not found for this lesson' });
    }
    return reply.send(result);
  }

  async createProgress(
    request: FastifyRequest<{ Body: CreateUserProgressDTO }>,
    reply: FastifyReply
  ) {
    const userId = await this.getUserId();
    const useCase = new CreateUserProgressUseCase(this.repository);
    const result = await useCase.execute(userId, request.body);
    return reply.code(201).send(result);
  }

  async updateProgress(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateUserProgressDTO }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const useCase = new UpdateProgressUseCase(this.repository);
    const result = await useCase.execute(id, request.body);
    return reply.send(result);
  }

  async deleteProgress(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const useCase = new DeleteProgressUseCase(this.repository);
    await useCase.execute(id);
    return reply.code(204).send();
  }
}

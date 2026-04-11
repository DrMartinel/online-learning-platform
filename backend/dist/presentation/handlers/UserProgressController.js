"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProgressController = void 0;
const SupabaseUserProgressRepository_1 = require("../../infrastructure/supabase/repositories/SupabaseUserProgressRepository");
const GetCourseProgress_1 = require("../../application/use-cases/user-progress/GetCourseProgress");
const GetLessonProgress_1 = require("../../application/use-cases/user-progress/GetLessonProgress");
const CreateUserProgress_1 = require("../../application/use-cases/user-progress/CreateUserProgress");
const UpdateProgress_1 = require("../../application/use-cases/user-progress/UpdateProgress");
const DeleteProgress_1 = require("../../application/use-cases/user-progress/DeleteProgress");
class UserProgressController {
    supabase;
    repository;
    constructor(supabase) {
        this.supabase = supabase;
        this.repository = new SupabaseUserProgressRepository_1.SupabaseUserProgressRepository(supabase);
    }
    async getUserId() {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error || !user) {
            throw new Error('Unauthorized');
        }
        return user.id;
    }
    async getCourseProgress(request, reply) {
        const userId = await this.getUserId();
        const { courseId } = request.params;
        const useCase = new GetCourseProgress_1.GetCourseProgressUseCase(this.repository);
        const result = await useCase.execute(userId, courseId);
        return reply.send(result);
    }
    async getLessonProgress(request, reply) {
        const userId = await this.getUserId();
        const { lessonId } = request.params;
        const useCase = new GetLessonProgress_1.GetLessonProgressUseCase(this.repository);
        const result = await useCase.execute(userId, lessonId);
        if (!result) {
            return reply.code(404).send({ error: 'Progress not found for this lesson' });
        }
        return reply.send(result);
    }
    async createProgress(request, reply) {
        const userId = await this.getUserId();
        const useCase = new CreateUserProgress_1.CreateUserProgressUseCase(this.repository);
        const result = await useCase.execute(userId, request.body);
        return reply.code(201).send(result);
    }
    async updateProgress(request, reply) {
        const { id } = request.params;
        const useCase = new UpdateProgress_1.UpdateProgressUseCase(this.repository);
        const result = await useCase.execute(id, request.body);
        return reply.send(result);
    }
    async deleteProgress(request, reply) {
        const { id } = request.params;
        const useCase = new DeleteProgress_1.DeleteProgressUseCase(this.repository);
        await useCase.execute(id);
        return reply.code(204).send();
    }
}
exports.UserProgressController = UserProgressController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonController = void 0;
const CreateLesson_1 = require("../../application/use-cases/lesson/CreateLesson");
const GetLessonsByCourse_1 = require("../../application/use-cases/lesson/GetLessonsByCourse");
const GetLessonById_1 = require("../../application/use-cases/lesson/GetLessonById");
const UpdateLesson_1 = require("../../application/use-cases/lesson/UpdateLesson");
const DeleteLesson_1 = require("../../application/use-cases/lesson/DeleteLesson");
const SupabaseLessonRepository_1 = require("../../infrastructure/supabase/repositories/SupabaseLessonRepository");
class LessonController {
    createLesson;
    getLessonsByCourse;
    getLessonById;
    updateLesson;
    deleteLesson;
    constructor(supabaseClient) {
        const lessonRepository = new SupabaseLessonRepository_1.SupabaseLessonRepository(supabaseClient);
        this.createLesson = new CreateLesson_1.CreateLessonUseCase(lessonRepository);
        this.getLessonsByCourse = new GetLessonsByCourse_1.GetLessonsByCourseUseCase(lessonRepository);
        this.getLessonById = new GetLessonById_1.GetLessonByIdUseCase(lessonRepository);
        this.updateLesson = new UpdateLesson_1.UpdateLessonUseCase(lessonRepository);
        this.deleteLesson = new DeleteLesson_1.DeleteLessonUseCase(lessonRepository);
    }
    async handleCreate(dto) {
        return this.createLesson.execute(dto);
    }
    async handleGetByCourse(courseId) {
        return this.getLessonsByCourse.execute(courseId);
    }
    async handleGetById(id) {
        return this.getLessonById.execute(id);
    }
    async handleUpdate(id, dto) {
        return this.updateLesson.execute(id, dto);
    }
    async handleDelete(id) {
        return this.deleteLesson.execute(id);
    }
}
exports.LessonController = LessonController;

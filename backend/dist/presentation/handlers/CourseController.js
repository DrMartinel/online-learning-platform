"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseController = void 0;
const CreateCourse_1 = require("../../application/use-cases/course/CreateCourse");
const FindCourseById_1 = require("../../application/use-cases/course/FindCourseById");
const ListCourses_1 = require("../../application/use-cases/course/ListCourses");
const UpdateCourse_1 = require("../../application/use-cases/course/UpdateCourse");
const DeleteCourse_1 = require("../../application/use-cases/course/DeleteCourse");
const SupabaseCourseRepository_1 = require("../../infrastructure/supabase/repositories/SupabaseCourseRepository");
class CourseController {
    createCourseUseCase;
    findCourseByIdUseCase;
    listCoursesUseCase;
    updateCourseUseCase;
    deleteCourseUseCase;
    constructor(supabaseClient) {
        const courseRepository = new SupabaseCourseRepository_1.SupabaseCourseRepository(supabaseClient);
        this.createCourseUseCase = new CreateCourse_1.CreateCourseUseCase(courseRepository);
        this.findCourseByIdUseCase = new FindCourseById_1.FindCourseByIdUseCase(courseRepository);
        this.listCoursesUseCase = new ListCourses_1.ListCoursesUseCase(courseRepository);
        this.updateCourseUseCase = new UpdateCourse_1.UpdateCourseUseCase(courseRepository);
        this.deleteCourseUseCase = new DeleteCourse_1.DeleteCourseUseCase(courseRepository);
    }
    /**
     * Create a new course
     * POST /api/courses
     */
    async create(instructorId, dto) {
        return this.createCourseUseCase.execute(instructorId, dto);
    }
    /**
     * Get a course by ID
     * GET /api/courses/:id
     */
    async getById(id) {
        return this.findCourseByIdUseCase.execute(id);
    }
    /**
     * List all courses with optional filters
     * GET /api/courses
     */
    async list(filter) {
        return this.listCoursesUseCase.execute(filter);
    }
    /**
     * Update a course
     * PUT /api/courses/:id
     */
    async update(dto) {
        return this.updateCourseUseCase.execute(dto);
    }
    /**
     * Delete a course
     * DELETE /api/courses/:id
     */
    async delete(id) {
        return this.deleteCourseUseCase.execute(id);
    }
}
exports.CourseController = CourseController;

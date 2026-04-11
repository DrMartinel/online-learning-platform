"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCourseProgressUseCase = void 0;
class GetCourseProgressUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, courseId) {
        const progress = await this.repository.findByUserAndCourse(userId, courseId);
        const completedLessonsCount = await this.repository.countCompletedLessonsInCourse(userId, courseId);
        const totalLessonsCount = await this.repository.countTotalLessonsInCourse(courseId);
        const percentage = totalLessonsCount === 0 ? 0 : Math.round((completedLessonsCount / totalLessonsCount) * 100);
        return {
            courseId,
            progress,
            completedLessonsCount,
            totalLessonsCount,
            percentage,
        };
    }
}
exports.GetCourseProgressUseCase = GetCourseProgressUseCase;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseProgressSchema = exports.updateUserProgressSchema = exports.createUserProgressSchema = exports.userProgressSchema = void 0;
const zod_1 = require("zod");
/** Schema for individual user progress record */
exports.userProgressSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    lessonId: zod_1.z.string().uuid(),
    completed: zod_1.z.boolean(),
    completedAt: zod_1.z.string().datetime().nullable(),
}).strict();
/** Payload for creating a progress record */
exports.createUserProgressSchema = zod_1.z.object({
    lessonId: zod_1.z.string().uuid(),
    completed: zod_1.z.boolean().default(false),
}).strict();
/** Payload for updating a progress record */
exports.updateUserProgressSchema = zod_1.z.object({
    completed: zod_1.z.boolean(),
}).strict();
/** Response for a course's progress overview */
exports.courseProgressSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid(),
    progress: zod_1.z.array(exports.userProgressSchema),
    completedLessonsCount: zod_1.z.number(),
    totalLessonsCount: zod_1.z.number(),
    percentage: zod_1.z.number(),
}).strict();

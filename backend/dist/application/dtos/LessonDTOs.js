"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLessonRequestSchema = exports.createLessonRequestSchema = exports.lessonSchema = void 0;
const zod_1 = require("zod");
exports.lessonSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    courseId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    videoUrl: zod_1.z.string().url().nullable().optional(),
    content: zod_1.z.string().nullable().optional(),
    orderIndex: zod_1.z.number().int(),
    createdAt: zod_1.z.string()
}).strict();
exports.createLessonRequestSchema = zod_1.z.object({
    courseId: zod_1.z.string().uuid(),
    title: zod_1.z.string().min(1),
    videoUrl: zod_1.z.string().url().nullable().optional(),
    content: zod_1.z.string().nullable().optional(),
    orderIndex: zod_1.z.number().int()
}).strict();
exports.updateLessonRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    videoUrl: zod_1.z.string().url().nullable().optional(),
    content: zod_1.z.string().nullable().optional(),
    orderIndex: zod_1.z.number().int().optional()
}).strict();

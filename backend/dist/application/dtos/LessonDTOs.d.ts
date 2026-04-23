import { z } from 'zod';
export declare const lessonSchema: z.ZodObject<{
    id: z.ZodString;
    courseId: z.ZodString;
    title: z.ZodString;
    videoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderIndex: z.ZodNumber;
    createdAt: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
    courseId: string;
    title: string;
    orderIndex: number;
    createdAt: string;
    videoUrl?: string | null | undefined;
    content?: string | null | undefined;
}, {
    id: string;
    courseId: string;
    title: string;
    orderIndex: number;
    createdAt: string;
    videoUrl?: string | null | undefined;
    content?: string | null | undefined;
}>;
export declare const createLessonRequestSchema: z.ZodObject<{
    courseId: z.ZodString;
    title: z.ZodString;
    videoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderIndex: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    courseId: string;
    title: string;
    orderIndex: number;
    videoUrl?: string | null | undefined;
    content?: string | null | undefined;
}, {
    courseId: string;
    title: string;
    orderIndex: number;
    videoUrl?: string | null | undefined;
    content?: string | null | undefined;
}>;
export declare const updateLessonRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    videoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderIndex: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    title?: string | undefined;
    videoUrl?: string | null | undefined;
    content?: string | null | undefined;
    orderIndex?: number | undefined;
}, {
    title?: string | undefined;
    videoUrl?: string | null | undefined;
    content?: string | null | undefined;
    orderIndex?: number | undefined;
}>;
export type LessonDTO = z.infer<typeof lessonSchema>;
export type CreateLessonRequestDTO = z.infer<typeof createLessonRequestSchema>;
export type UpdateLessonRequestDTO = z.infer<typeof updateLessonRequestSchema>;
//# sourceMappingURL=LessonDTOs.d.ts.map
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
    createdAt: string;
    title: string;
    courseId: string;
    orderIndex: number;
    content?: string | null | undefined;
    videoUrl?: string | null | undefined;
}, {
    id: string;
    createdAt: string;
    title: string;
    courseId: string;
    orderIndex: number;
    content?: string | null | undefined;
    videoUrl?: string | null | undefined;
}>;
export declare const createLessonRequestSchema: z.ZodObject<{
    courseId: z.ZodString;
    title: z.ZodString;
    videoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderIndex: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    title: string;
    courseId: string;
    orderIndex: number;
    content?: string | null | undefined;
    videoUrl?: string | null | undefined;
}, {
    title: string;
    courseId: string;
    orderIndex: number;
    content?: string | null | undefined;
    videoUrl?: string | null | undefined;
}>;
export declare const updateLessonRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    videoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    orderIndex: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    content?: string | null | undefined;
    title?: string | undefined;
    videoUrl?: string | null | undefined;
    orderIndex?: number | undefined;
}, {
    content?: string | null | undefined;
    title?: string | undefined;
    videoUrl?: string | null | undefined;
    orderIndex?: number | undefined;
}>;
export type LessonDTO = z.infer<typeof lessonSchema>;
export type CreateLessonRequestDTO = z.infer<typeof createLessonRequestSchema>;
export type UpdateLessonRequestDTO = z.infer<typeof updateLessonRequestSchema>;
//# sourceMappingURL=LessonDTOs.d.ts.map
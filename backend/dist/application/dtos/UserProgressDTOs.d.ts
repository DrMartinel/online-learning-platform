import { z } from 'zod';
/** Schema for individual user progress record */
export declare const userProgressSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    lessonId: z.ZodString;
    completed: z.ZodBoolean;
    completedAt: z.ZodNullable<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    userId: string;
    id: string;
    lessonId: string;
    completed: boolean;
    completedAt: string | null;
}, {
    userId: string;
    id: string;
    lessonId: string;
    completed: boolean;
    completedAt: string | null;
}>;
export type UserProgressDTO = z.infer<typeof userProgressSchema>;
/** Payload for creating a progress record */
export declare const createUserProgressSchema: z.ZodObject<{
    lessonId: z.ZodString;
    completed: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    lessonId: string;
    completed: boolean;
}, {
    lessonId: string;
    completed?: boolean | undefined;
}>;
export type CreateUserProgressDTO = z.infer<typeof createUserProgressSchema>;
/** Payload for updating a progress record */
export declare const updateUserProgressSchema: z.ZodObject<{
    completed: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    completed: boolean;
}, {
    completed: boolean;
}>;
export type UpdateUserProgressDTO = z.infer<typeof updateUserProgressSchema>;
/** Response for a course's progress overview */
export declare const courseProgressSchema: z.ZodObject<{
    courseId: z.ZodString;
    progress: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodString;
        lessonId: z.ZodString;
        completed: z.ZodBoolean;
        completedAt: z.ZodNullable<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        userId: string;
        id: string;
        lessonId: string;
        completed: boolean;
        completedAt: string | null;
    }, {
        userId: string;
        id: string;
        lessonId: string;
        completed: boolean;
        completedAt: string | null;
    }>, "many">;
    completedLessonsCount: z.ZodNumber;
    totalLessonsCount: z.ZodNumber;
    percentage: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    courseId: string;
    progress: {
        userId: string;
        id: string;
        lessonId: string;
        completed: boolean;
        completedAt: string | null;
    }[];
    completedLessonsCount: number;
    totalLessonsCount: number;
    percentage: number;
}, {
    courseId: string;
    progress: {
        userId: string;
        id: string;
        lessonId: string;
        completed: boolean;
        completedAt: string | null;
    }[];
    completedLessonsCount: number;
    totalLessonsCount: number;
    percentage: number;
}>;
export type CourseProgressDTO = z.infer<typeof courseProgressSchema>;
//# sourceMappingURL=UserProgressDTOs.d.ts.map
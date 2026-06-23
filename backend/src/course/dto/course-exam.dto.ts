import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// DTOs for linking exams to a course
export const organizeExamSchema = z.object({
  examIds: z.array(z.string().uuid()),
});
export class OrganizeExamDTO extends createZodDto(organizeExamSchema) {}

export const courseExamResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  examId: z.string().uuid(),
  createdAt: z.date(),
});
export class CourseExamResponseDTO extends createZodDto(courseExamResponseSchema) {}

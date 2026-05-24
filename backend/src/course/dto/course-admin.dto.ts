import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const adminCreateCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  instructorId: z.string().uuid(),
});
export class AdminCreateCourseDTO extends createZodDto(adminCreateCourseSchema) {}

export const adminUpdateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  isPublished: z.boolean().optional(),
  instructorId: z.string().uuid().optional(),
});
export class AdminUpdateCourseDTO extends createZodDto(adminUpdateCourseSchema) {}

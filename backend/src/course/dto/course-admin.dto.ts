// backend/src/course/dto/course-admin.dto.ts

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const adminCreateCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  instructorId: z.string().uuid(),
  price: z.number().min(0).optional().default(0), // <--- Bổ sung dòng này
});
export class AdminCreateCourseDTO extends createZodDto(adminCreateCourseSchema) {}

export const adminUpdateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  instructorId: z.string().uuid().optional(),
  isPublished: z.boolean().optional(),
  price: z.number().min(0).optional(), // <--- Bổ sung dòng này
});
export class AdminUpdateCourseDTO extends createZodDto(adminUpdateCourseSchema) {}

export const adminAssignInstructorSchema = z.object({
  instructorId: z.string().uuid(),
});
export class AdminAssignInstructorDTO extends createZodDto(adminAssignInstructorSchema) {}
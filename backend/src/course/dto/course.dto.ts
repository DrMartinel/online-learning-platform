import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});
export class CreateCourseDTO extends createZodDto(createCourseSchema) {}

export const updateCourseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  isPublished: z.boolean().optional(),
});
export class UpdateCourseDTO extends createZodDto(updateCourseSchema) {}

export const courseResponseSchema = z.object({
  id: z.string().uuid(),
  instructorId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  isPublished: z.boolean(),
  createdAt: z.date(),
});
export class CourseResponseDTO extends createZodDto(courseResponseSchema) {}

export const listCoursesFilterSchema = z.object({
  published: z.coerce.boolean().optional(),
  instructorId: z.string().uuid().optional(),
});
export class ListCoursesFilterDTO extends createZodDto(listCoursesFilterSchema) {}

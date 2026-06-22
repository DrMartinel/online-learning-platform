import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, { message: 'Đánh giá tối thiểu là 1 sao' }).max(5, { message: 'Đánh giá tối đa là 5 sao' }),
  comment: z.string().optional(),
});
export class CreateReviewDTO extends createZodDto(createReviewSchema) {}

export const adminUpdateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'hidden'], { message: 'Trạng thái không hợp lệ' }),
});
export class AdminUpdateReviewStatusDTO extends createZodDto(adminUpdateReviewStatusSchema) {}

export const adminRespondReviewSchema = z.object({
  response: z.string().min(1, { message: 'Phản hồi không được để trống' }),
});
export class AdminRespondReviewDTO extends createZodDto(adminRespondReviewSchema) {}

export const reviewResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  rating: z.number(),
  comment: z.string().nullable(),
  status: z.string(),
  response: z.string().nullable(),
  respondedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userFullName: z.string().optional(),
  userAvatarUrl: z.string().optional(),
  courseTitle: z.string().optional(),
});
export class ReviewResponseDTO extends createZodDto(reviewResponseSchema) {}

export const listReviewsFilterSchema = z.object({
  courseId: z.string().uuid().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  status: z.enum(['pending', 'approved', 'hidden']).optional(),
});
export class ListReviewsFilterDTO extends createZodDto(listReviewsFilterSchema) {}

import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
});
export class UpdateUserProfileDTO extends createZodDto(updateUserProfileSchema) {}

export const userProfileResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.string(),
  permissions: z.array(z.string()).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  createdAt: z.date(),
});
export class UserProfileResponseDTO extends createZodDto(userProfileResponseSchema) {}

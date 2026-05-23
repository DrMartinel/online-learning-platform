import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const adminUpdateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  role: z.enum(['student', 'operator', 'admin']).optional(),
});
export class AdminUpdateUserDTO extends createZodDto(adminUpdateUserSchema) {}

export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(['student', 'operator', 'admin']),
});
export class AdminCreateUserDTO extends createZodDto(adminCreateUserSchema) {}

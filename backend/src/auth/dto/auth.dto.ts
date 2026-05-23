import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const signUpRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1).optional(),
    fullName: z.string().min(1),
  })
  .strict();

export class SignUpDTO extends createZodDto(signUpRequestSchema) {}

export const signInRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1).optional(),
  })
  .strict();

export class SignInDTO extends createZodDto(signInRequestSchema) {}

export const authResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userId: z.string(),
  role: z.string(),
  expiresAt: z.number().optional(),
});

export class AuthResultDTO extends createZodDto(authResultSchema) {}

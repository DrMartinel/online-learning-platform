import { z } from 'zod';

/** Sign-up payload (HTTP / use-case input) */
export const signUpRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1).optional(),
    fullName: z.string().min(1),
  })
  .strict();

export type SignUpDTO = z.infer<typeof signUpRequestSchema>;

/** Sign-in payload */
export const signInRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1).optional(),
  })
  .strict();

export type SignInDTO = z.infer<typeof signInRequestSchema>;

/** Successful auth session returned to clients */
export const authResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  userId: z.string(),
  role: z.string(),
  expiresAt: z.number().optional(),
});

export type AuthResultDTO = z.infer<typeof authResultSchema>;

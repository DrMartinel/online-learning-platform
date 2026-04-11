import { z } from 'zod';
/** Sign-up payload (HTTP / use-case input) */
export declare const signUpRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    fullName: z.ZodString;
}, "strict", z.ZodTypeAny, {
    email: string;
    fullName: string;
    password?: string | undefined;
}, {
    email: string;
    fullName: string;
    password?: string | undefined;
}>;
export type SignUpDTO = z.infer<typeof signUpRequestSchema>;
/** Sign-in payload */
export declare const signInRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    email: string;
    password?: string | undefined;
}, {
    email: string;
    password?: string | undefined;
}>;
export type SignInDTO = z.infer<typeof signInRequestSchema>;
/** Successful auth session returned to clients */
export declare const authResultSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    userId: z.ZodString;
    role: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: string;
    expiresAt?: number | undefined;
}, {
    accessToken: string;
    refreshToken: string;
    userId: string;
    role: string;
    expiresAt?: number | undefined;
}>;
export type AuthResultDTO = z.infer<typeof authResultSchema>;
//# sourceMappingURL=AuthDTOs.d.ts.map
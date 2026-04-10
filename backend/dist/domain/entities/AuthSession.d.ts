export declare class AuthSession {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly userId: string;
    readonly role: string;
    readonly expiresAt?: number | undefined;
    constructor(accessToken: string, refreshToken: string, userId: string, role: string, expiresAt?: number | undefined);
}
//# sourceMappingURL=AuthSession.d.ts.map
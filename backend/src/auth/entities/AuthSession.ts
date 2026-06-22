export class AuthSession {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly userId: string,
    public readonly role: string,
    public readonly expiresAt?: number
  ) {}
}

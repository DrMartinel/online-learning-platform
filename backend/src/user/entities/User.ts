export type UserRole = 'student' | 'operator' | 'admin';

export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public fullName: string,
    public role: UserRole,
    public bio: string | undefined,
    public avatarUrl: string | undefined,
    public readonly createdAt: Date
  ) {}

  public permissions: string[] = [];

  public isOperator(): boolean {
    return this.role === 'operator' || this.role === 'admin';
  }

  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public updateFullName(newName: string): void {
    if (newName.trim().length === 0) {
      throw new Error('Full name cannot be empty');
    }
    this.fullName = newName.trim();
  }
}

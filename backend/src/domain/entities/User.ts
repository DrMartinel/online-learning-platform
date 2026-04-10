export type UserRole = 'student' | 'instructor' | 'admin';

export class User {
  constructor(
    public readonly id: string,
    public fullName: string | null,
    public role: UserRole,
    public readonly createdAt: Date
  ) {}

  public isInstructor(): boolean {
    return this.role === 'instructor' || this.role === 'admin';
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

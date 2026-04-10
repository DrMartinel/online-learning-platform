export type UserRole = 'student' | 'instructor' | 'admin';
export declare class User {
    readonly id: string;
    fullName: string | null;
    role: UserRole;
    readonly createdAt: Date;
    constructor(id: string, fullName: string | null, role: UserRole, createdAt: Date);
    isInstructor(): boolean;
    isAdmin(): boolean;
    updateFullName(newName: string): void;
}
//# sourceMappingURL=User.d.ts.map
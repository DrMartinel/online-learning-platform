import { UserRole } from '../../domain/entities/User';
export interface UserProfileDTO {
    id: string;
    fullName: string | null;
    role: UserRole;
    createdAt: string;
}
export interface UpdateUserProfileDTO {
    id: string;
    fullName?: string;
}
//# sourceMappingURL=UserDTOs.d.ts.map
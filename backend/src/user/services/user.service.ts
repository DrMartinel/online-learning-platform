import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/Iuser.repository';
import { User } from '../entities/User';
import { UpdateUserProfileDTO, UserProfileResponseDTO } from '../dto/user.dto';
import { AdminUpdateUserDTO } from '../dto/user-admin.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: UserRepository,
  ) {}

  async getProfile(id: string): Promise<UserProfileResponseDTO> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.mapToResponse(user);
  }

  async updateProfile(id: string, dto: UpdateUserProfileDTO): Promise<UserProfileResponseDTO> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    await this.userRepo.save(user);
    return this.mapToResponse(user);
  }

  // --- Admin Methods ---

  async adminListUsers(): Promise<UserProfileResponseDTO[]> {
    const users = await this.userRepo.findAll();
    return users.map(user => this.mapToResponse(user));
  }

  async adminUpdateProfile(id: string, dto: AdminUpdateUserDTO): Promise<UserProfileResponseDTO> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    
    // Note: Updating `user.role` here only updates the `profiles` table.
    // In a fully integrated IAM system, you would also insert/update `iam_user_roles`.
    if (dto.role) {
      user.role = dto.role as any;
    }

    await this.userRepo.save(user);
    return this.mapToResponse(user);
  }

  private mapToResponse(user: User): UserProfileResponseDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }
}

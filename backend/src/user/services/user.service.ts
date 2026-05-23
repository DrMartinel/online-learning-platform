import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { UserRepository } from '../repositories/Iuser.repository';
import { User } from '../entities/User';
import { UpdateUserProfileDTO, UserProfileResponseDTO } from '../dto/user.dto';
import { AdminUpdateUserDTO } from '../dto/user-admin.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepo: UserRepository,
    private readonly supabase: SupabaseClient,
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

  async adminCreateUser(dto: AdminUpdateUserDTO & { email: string, password?: string }): Promise<UserProfileResponseDTO> {
    const password = dto.password || randomBytes(8).toString('hex');
    
    const { data, error } = await this.supabase.auth.admin.createUser({
      email: dto.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: dto.fullName }
    });

    if (error) {
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }

    if (!data.user) {
      throw new BadRequestException('User creation failed silently.');
    }

    // Wait a brief moment for the Supabase trigger to insert the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the profile with the explicitly requested role
    return this.adminUpdateProfile(data.user.id, { role: dto.role, fullName: dto.fullName });
  }

  async adminUpdateProfile(id: string, dto: AdminUpdateUserDTO): Promise<UserProfileResponseDTO> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    // Manage role via IAM tables
    if (dto.role) {
      const { data: roleData, error: roleError } = await this.supabase
        .from('iam_roles')
        .select('id')
        .eq('urn', `role:user:${dto.role}`)
        .single();
      
      if (!roleError && roleData) {
        await this.supabase.from('iam_user_roles').delete().eq('user_id', user.id);
        await this.supabase.from('iam_user_roles').insert({ user_id: user.id, role_id: roleData.id });
        user.role = dto.role as any;
      } else {
        console.error('Failed to resolve role ID for', dto.role);
      }
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

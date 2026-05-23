import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from '../../services/user.service';
import { UserProfileResponseDTO } from '../../dto/user.dto';
import { AdminUpdateUserDTO, AdminCreateUserDTO } from '../../dto/user-admin.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../../../iam/decorators/auth.decorator';

@ApiTags('admin/users')
@ApiBearerAuth()
@Controller('admin/users')
export class UserAdminController {
  constructor(private readonly userService: UserService) { }

  @Get()
  @Auth('action:admin:user:list')
  @ApiOperation({ summary: 'Admin: List all users' })
  @ApiResponse({ status: 200, type: [UserProfileResponseDTO] })
  async listUsers(): Promise<UserProfileResponseDTO[]> {
    return this.userService.adminListUsers();
  }

  @Post()
  @Auth('action:admin:user:create')
  @ApiOperation({ summary: 'Admin: Create a new user' })
  @ApiResponse({ status: 201, type: UserProfileResponseDTO })
  async createUser(@Body() dto: AdminCreateUserDTO): Promise<UserProfileResponseDTO> {
    return this.userService.adminCreateUser(dto);
  }

  @Get(':id')
  @Auth('action:admin:user:read')
  @ApiOperation({ summary: 'Admin: Get user profile by ID' })
  @ApiResponse({ status: 200, type: UserProfileResponseDTO })
  async getUser(@Param('id') id: string): Promise<UserProfileResponseDTO> {
    return this.userService.getProfile(id);
  }

  @Put(':id')
  @Auth('action:admin:user:update')
  @ApiOperation({ summary: 'Admin: Update user profile and role' })
  @ApiResponse({ status: 200, type: UserProfileResponseDTO })
  async updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDTO): Promise<UserProfileResponseDTO> {
    return this.userService.adminUpdateProfile(id, dto);
  }

  // Delete is omitted since it requires Supabase Auth Service Role Key interactions, 
  // which might have cascading effects on other features.
}

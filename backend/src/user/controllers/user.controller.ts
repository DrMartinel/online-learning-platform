import { Controller, Get, Put, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateUserProfileDTO, UserProfileResponseDTO } from '../dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDTO })
  async getProfile(@Headers('x-user-id') userId: string): Promise<UserProfileResponseDTO> {
    if (!userId) throw new UnauthorizedException();
    return this.userService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDTO })
  async updateProfile(@Headers('x-user-id') userId: string, @Body() dto: UpdateUserProfileDTO): Promise<UserProfileResponseDTO> {
    if (!userId) throw new UnauthorizedException();
    return this.userService.updateProfile(userId, dto);
  }
}

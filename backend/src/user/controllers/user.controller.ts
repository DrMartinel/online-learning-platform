import { Controller, Get, Put, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UpdateUserProfileDTO, UserProfileResponseDTO } from '../dto/user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('user')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @Auth('action:user:read:me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDTO })
  async getProfile(@CurrentUser() user: any): Promise<UserProfileResponseDTO> {
    if (!user) throw new UnauthorizedException();
    return this.userService.getProfile(user.id);
  }

  @Put('me')
  @Auth('action:user:update:me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDTO })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateUserProfileDTO): Promise<UserProfileResponseDTO> {
    if (!user) throw new UnauthorizedException();
    return this.userService.updateProfile(user.id, dto);
  }
}

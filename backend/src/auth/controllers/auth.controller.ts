import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignUpDTO, SignInDTO, AuthResultDTO } from '../dto/auth.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created', type: AuthResultDTO })
  async signUp(@Body() dto: SignUpDTO): Promise<AuthResultDTO> {
    return this.authService.signUp(dto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login an existing user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in', type: AuthResultDTO })
  async signIn(@Body() dto: SignInDTO): Promise<AuthResultDTO> {
    return this.authService.signIn(dto);
  }

  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout the current user' })
  @ApiResponse({ status: 204, description: 'Successfully logged out' })
  async signOut(): Promise<void> {
    return this.authService.signOut();
  }
}

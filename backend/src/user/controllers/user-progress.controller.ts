import { Controller, Post, Get, Put, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UserProgressService } from '../services/user-progress.service';
import { CreateUserProgressDTO, UpdateUserProgressDTO, UserProgressResponseDTO, CourseProgressResponseDTO } from '../dto/user-progress.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('user-progress')
@Controller('user-progress')
export class UserProgressController {
  constructor(private readonly progressService: UserProgressService) {}

  @Post()
  @Auth('action:user_progress:create')
  @ApiOperation({ summary: 'Create user progress for a lesson' })
  @ApiResponse({ status: 201, type: UserProgressResponseDTO })
  async createProgress(@CurrentUser() user: any, @Body() dto: CreateUserProgressDTO): Promise<UserProgressResponseDTO> {
    if (!user) throw new UnauthorizedException();
    return this.progressService.createProgress(user.id, dto);
  }

  @Get('lesson/:lessonId')
  @Auth('action:user_progress:read')
  @ApiOperation({ summary: 'Get user progress for a lesson' })
  @ApiResponse({ status: 200, type: UserProgressResponseDTO })
  async getLessonProgress(@CurrentUser() user: any, @Param('lessonId') lessonId: string): Promise<UserProgressResponseDTO | null> {
    if (!user) throw new UnauthorizedException();
    return this.progressService.getLessonProgress(user.id, lessonId);
  }

  @Get('course/:courseId')
  @Auth('action:user_progress:read')
  @ApiOperation({ summary: 'Get overall progress for a course' })
  @ApiResponse({ status: 200, type: CourseProgressResponseDTO })
  async getCourseProgress(@CurrentUser() user: any, @Param('courseId') courseId: string): Promise<CourseProgressResponseDTO> {
    if (!user) throw new UnauthorizedException();
    return this.progressService.getCourseProgress(user.id, courseId);
  }

  @Put('lesson/:lessonId')
  @Auth('action:user_progress:update')
  @ApiOperation({ summary: 'Update user progress for a lesson' })
  @ApiResponse({ status: 200, type: UserProgressResponseDTO })
  async updateProgress(@CurrentUser() user: any, @Param('lessonId') lessonId: string, @Body() dto: UpdateUserProgressDTO): Promise<UserProgressResponseDTO> {
    if (!user) throw new UnauthorizedException();
    return this.progressService.updateProgress(user.id, lessonId, dto);
  }
}

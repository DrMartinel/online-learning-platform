import { Controller, Post, Get, Put, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UserProgressService } from '../services/user-progress.service';
import { CreateUserProgressDTO, UpdateUserProgressDTO, UserProgressResponseDTO, CourseProgressResponseDTO } from '../dto/user-progress.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('user-progress')
@Controller('user-progress')
export class UserProgressController {
  constructor(private readonly progressService: UserProgressService) {}

  @Post()
  @ApiOperation({ summary: 'Create user progress for a lesson' })
  @ApiResponse({ status: 201, type: UserProgressResponseDTO })
  async createProgress(@Headers('x-user-id') userId: string, @Body() dto: CreateUserProgressDTO): Promise<UserProgressResponseDTO> {
    if (!userId) throw new UnauthorizedException();
    return this.progressService.createProgress(userId, dto);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get user progress for a lesson' })
  @ApiResponse({ status: 200, type: UserProgressResponseDTO })
  async getLessonProgress(@Headers('x-user-id') userId: string, @Param('lessonId') lessonId: string): Promise<UserProgressResponseDTO | null> {
    if (!userId) throw new UnauthorizedException();
    return this.progressService.getLessonProgress(userId, lessonId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get overall progress for a course' })
  @ApiResponse({ status: 200, type: CourseProgressResponseDTO })
  async getCourseProgress(@Headers('x-user-id') userId: string, @Param('courseId') courseId: string): Promise<CourseProgressResponseDTO> {
    if (!userId) throw new UnauthorizedException();
    return this.progressService.getCourseProgress(userId, courseId);
  }

  @Put('lesson/:lessonId')
  @ApiOperation({ summary: 'Update user progress for a lesson' })
  @ApiResponse({ status: 200, type: UserProgressResponseDTO })
  async updateProgress(@Headers('x-user-id') userId: string, @Param('lessonId') lessonId: string, @Body() dto: UpdateUserProgressDTO): Promise<UserProgressResponseDTO> {
    if (!userId) throw new UnauthorizedException();
    return this.progressService.updateProgress(userId, lessonId, dto);
  }
}

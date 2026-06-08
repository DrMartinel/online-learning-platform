import { Controller, Get, Post, Param, Body, Query, ForbiddenException } from '@nestjs/common';
import { ExamSessionService } from '../services/exam-session.service';
import {
  CreateExamAttemptDTO,
  SaveProgressDTO,
  SubmitExamAttemptDTO,
  ExamSessionResponseDTO,
  ExamAttemptResponseDTO,
} from '../dto/exam-session.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('exam-sessions')
@Controller('exam-sessions')
export class StudentExamSessionController {
  constructor(private readonly service: ExamSessionService) {}

  @Post(':id/enter')
  @Auth()
  @ApiOperation({ summary: 'Enter an exam session (validates time, access code, and enrollment)' })
  @ApiResponse({ status: 200, description: 'Session accessible', type: ExamSessionResponseDTO })
  async enter(
    @Param('id') sessionId: string,
    @CurrentUser() user: any,
    @Body('accessCode') accessCode?: string,
  ): Promise<ExamSessionResponseDTO> {
    return this.service.enterSession(sessionId, user.id, accessCode);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get basic session info before entering' })
  @ApiResponse({ status: 200, description: 'Session info', type: ExamSessionResponseDTO })
  async getSessionInfo(
    @Param('id') sessionId: string,
  ): Promise<ExamSessionResponseDTO> {
    const session = await this.service.getSessionDetail(sessionId);
    if (!session) {
      throw new ForbiddenException('Không tìm thấy đợt thi.');
    }
    // Không trả về accessCode thực sự ra ngoài
    return {
      ...session,
      accessCode: session.accessCode ? 'REQUIRED' : null
    } as any;
  }

  @Post('attempts/start')
  @Auth()
  @ApiOperation({ summary: 'Start a new exam attempt (or resume existing)' })
  @ApiResponse({ status: 201, description: 'Attempt started/resumed', type: ExamAttemptResponseDTO })
  async startAttempt(
    @CurrentUser() user: any,
    @Body() dto: CreateExamAttemptDTO,
  ): Promise<ExamAttemptResponseDTO> {
    return this.service.startAttempt(dto.sessionId, user.id, dto.accessCode);
  }

  @Post('attempts/:id/save-progress')
  @Auth()
  @ApiOperation({ summary: 'Save progress answers during exam in real-time' })
  @ApiResponse({ status: 200, description: 'Progress saved', type: ExamAttemptResponseDTO })
  async saveProgress(
    @Param('id') attemptId: string,
    @CurrentUser() user: any,
    @Body() dto: SaveProgressDTO,
  ): Promise<ExamAttemptResponseDTO> {
    return this.service.saveAttemptProgress(attemptId, user.id, dto.answers);
  }

  @Post('attempts/:id/submit')
  @Auth()
  @ApiOperation({ summary: 'Submit exam and calculate automatic grading score' })
  @ApiResponse({ status: 200, description: 'Exam submitted', type: ExamAttemptResponseDTO })
  async submit(
    @Param('id') attemptId: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitExamAttemptDTO,
  ): Promise<ExamAttemptResponseDTO> {
    return this.service.submitAttempt(attemptId, user.id, dto.answers);
  }

  @Get('attempts/:id')
  @Auth()
  @ApiOperation({ summary: 'Get current student attempt detail' })
  @ApiResponse({ status: 200, description: 'Attempt details', type: ExamAttemptResponseDTO })
  async getAttemptDetail(@Param('id') id: string, @CurrentUser() user: any): Promise<ExamAttemptResponseDTO> {
    return this.service.getAttemptDetail(id, user.id);
  }

  @Get('attempts/:id/exam-data')
  @Auth()
  @ApiOperation({ summary: 'Get exam data for an attempt (strips correct answers if in progress)' })
  @ApiResponse({ status: 200, description: 'Exam structure and questions' })
  async getAttemptExamData(@Param('id') id: string, @CurrentUser() user: any): Promise<any> {
    return this.service.getAttemptExamData(id, user.id);
  }
}

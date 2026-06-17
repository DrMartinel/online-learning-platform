import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ExamSessionService } from '../services/exam-session.service';
import { CreateExamSessionDTO, UpdateExamSessionDTO, ExamSessionResponseDTO } from '../dto/exam-session.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('admin-exam-sessions')
@Controller('admin/exam-sessions')
export class AdminExamSessionController {
  constructor(private readonly service: ExamSessionService) {}

  @Post()
  @Auth() // Cho phép Admin/Instructor đã login
  @ApiOperation({ summary: 'Create a new exam session' })
  @ApiResponse({ status: 201, description: 'Session created', type: ExamSessionResponseDTO })
  async create(@CurrentUser() user: any, @Body() dto: CreateExamSessionDTO): Promise<ExamSessionResponseDTO> {
    return this.service.createSession(dto, user.id);
  }

  @Get()
  @Auth()
  @ApiOperation({ summary: 'List all exam sessions with optional course filter' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiResponse({ status: 200, description: 'List of exam sessions', type: [ExamSessionResponseDTO] })
  async list(@Query('courseId') courseId?: string): Promise<ExamSessionResponseDTO[]> {
    return this.service.listSessions(courseId);
  }

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get exam session detail' })
  @ApiResponse({ status: 200, description: 'Session detail', type: ExamSessionResponseDTO })
  async getDetail(@Param('id') id: string): Promise<ExamSessionResponseDTO> {
    return this.service.getSessionDetail(id);
  }

  @Put(':id')
  @Auth()
  @ApiOperation({ summary: 'Update exam session' })
  @ApiResponse({ status: 200, description: 'Session updated', type: ExamSessionResponseDTO })
  async update(@Param('id') id: string, @Body() dto: UpdateExamSessionDTO): Promise<ExamSessionResponseDTO> {
    return this.service.updateSession(id, dto);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exam session' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.service.deleteSession(id);
  }

  @Get(':id/dashboard')
  @Auth()
  @ApiOperation({ summary: 'Get real-time exam session dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats and list of attempts' })
  async getDashboard(@Param('id') id: string): Promise<any> {
    return this.service.getSessionDashboard(id);
  }
}

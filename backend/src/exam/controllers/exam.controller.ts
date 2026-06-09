import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ExamService } from '../services/exam.service';
import {
  CreateExamDTO,
  UpdateExamDTO,
  AddExamQuestionDTO,
  UpdateExamQuestionDTO,
  ExamResponseDTO,
  ExamQuestionResponseDTO,
  ListExamsFilterDTO,
} from '../dto/exam.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Auth } from '../../iam/decorators/auth.decorator';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('exams')
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @Auth('action:exam:create')
  @ApiOperation({ summary: 'Create a new exam (optionally with questions)' })
  @ApiResponse({ status: 201, description: 'Exam created', type: ExamResponseDTO })
  async createExam(@CurrentUser() user: any, @Body() dto: CreateExamDTO): Promise<ExamResponseDTO> {
    return this.examService.create(user.id, dto);
  }

  @Get()
  @Auth('action:exam:list')
  @ApiOperation({ summary: 'List exams with optional filters' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiResponse({ status: 200, description: 'List of exams', type: [ExamResponseDTO] })
  async listExams(@Query() filter: ListExamsFilterDTO): Promise<ExamResponseDTO[]> {
    return this.examService.list(filter);
  }

  @Get('public/:id')
  @Auth()
  @ApiOperation({ summary: 'Get public exam by ID (student view)' })
  @ApiResponse({ status: 200, description: 'The public exam', type: ExamResponseDTO })
  @ApiResponse({ status: 404, description: 'Exam not found or not public' })
  async getPublicExam(@Param('id') id: string): Promise<ExamResponseDTO> {
    return this.examService.findPublicExamById(id);
  }

  @Get(':id')
  @Auth('action:exam:read')
  @ApiOperation({ summary: 'Get exam by ID with all questions' })
  @ApiResponse({ status: 200, description: 'The exam', type: ExamResponseDTO })
  async getExam(@Param('id') id: string): Promise<ExamResponseDTO> {
    return this.examService.findById(id);
  }

  @Put(':id')
  @Auth('action:exam:update')
  @ApiOperation({ summary: 'Update exam metadata (title, header)' })
  @ApiResponse({ status: 200, description: 'Exam updated', type: ExamResponseDTO })
  async updateExam(@Param('id') id: string, @Body() dto: UpdateExamDTO): Promise<ExamResponseDTO> {
    return this.examService.update(id, dto);
  }

  @Delete(':id')
  @Auth('action:exam:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an exam and all its question links' })
  @ApiResponse({ status: 204, description: 'Exam deleted' })
  async deleteExam(@Param('id') id: string): Promise<void> {
    return this.examService.delete(id);
  }

  // --- Exam question endpoints ---

  @Post(':id/questions')
  @Auth('action:exam:update')
  @ApiOperation({ summary: 'Add a question to an exam' })
  @ApiResponse({ status: 201, description: 'Question added', type: ExamQuestionResponseDTO })
  async addQuestion(@Param('id') examId: string, @Body() dto: AddExamQuestionDTO): Promise<ExamQuestionResponseDTO> {
    return this.examService.addQuestion(examId, dto);
  }

  @Put(':id/questions/:eqId')
  @Auth('action:exam:update')
  @ApiOperation({ summary: 'Update question order/points in an exam' })
  @ApiResponse({ status: 200, description: 'Exam question updated', type: ExamQuestionResponseDTO })
  async updateExamQuestion(
    @Param('id') examId: string,
    @Param('eqId') eqId: string,
    @Body() dto: UpdateExamQuestionDTO,
  ): Promise<ExamQuestionResponseDTO> {
    return this.examService.updateExamQuestion(examId, eqId, dto);
  }

  @Delete(':id/questions/:eqId')
  @Auth('action:exam:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a question from an exam' })
  @ApiResponse({ status: 204, description: 'Question removed from exam' })
  async removeQuestion(
    @Param('id') examId: string,
    @Param('eqId') eqId: string,
  ): Promise<void> {
    return this.examService.removeQuestion(examId, eqId);
  }
}

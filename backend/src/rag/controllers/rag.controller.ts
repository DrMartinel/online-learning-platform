import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Auth } from '../../iam/decorators/auth.decorator';
import { RagService } from '../services/rag.service';
import { QueryRAGDto, RAGResponseDto, IngestStatusDto } from '../dto/rag.dto';

@ApiTags('rag')
@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Guard that ensures GEMINI_API_KEY is configured before allowing
   * any RAG operations.
   */
  private ensureApiKeyConfigured(): void {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException(
        'RAG system is not configured. Please set the GEMINI_API_KEY environment variable.',
      );
    }
  }

  @Post('query')
  @ApiBearerAuth()
  @Auth('action:rag:query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask a question about course content using RAG' })
  @ApiResponse({ status: 200, description: 'AI-generated answer with sources', type: RAGResponseDto })
  async query(@Body() dto: QueryRAGDto): Promise<RAGResponseDto> {
    this.ensureApiKeyConfigured();
    return this.ragService.query(dto.question, dto.courseId, dto.maxResults);
  }

  @Post('ingest/course/:id')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Ingest/re-ingest all content for a course' })
  @ApiResponse({ status: 200, description: 'Ingestion started successfully' })
  async ingestCourse(@Param('id') courseId: string): Promise<{ message: string }> {
    this.ensureApiKeyConfigured();
    await this.ragService.ingestCourse(courseId);
    return { message: `Ingestion complete for course ${courseId}` };
  }

  @Post('ingest/lesson/:id')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Ingest/re-ingest content for a single lesson' })
  @ApiResponse({ status: 200, description: 'Ingestion started successfully' })
  async ingestLesson(@Param('id') lessonId: string): Promise<{ message: string }> {
    this.ensureApiKeyConfigured();
    await this.ragService.ingestLesson(lessonId);
    return { message: `Ingestion complete for lesson ${lessonId}` };
  }

  @Get('status/course/:id')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @ApiOperation({ summary: 'Admin: Get embedding/ingestion status for a course' })
  @ApiResponse({ status: 200, description: 'Ingestion status', type: IngestStatusDto })
  async getStatus(@Param('id') courseId: string): Promise<IngestStatusDto> {
    this.ensureApiKeyConfigured();
    return this.ragService.getIngestionStatus(courseId);
  }

  @Post('transcribe/lesson/:id')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Force re-transcription of a lesson video' })
  @ApiResponse({ status: 200, description: 'Transcription complete' })
  async transcribeLesson(@Param('id') lessonId: string): Promise<{ message: string }> {
    this.ensureApiKeyConfigured();
    await this.ragService.transcribeLesson(lessonId);
    return { message: `Transcription complete for lesson ${lessonId}` };
  }
}

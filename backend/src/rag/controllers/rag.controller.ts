import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Auth } from '../../iam/decorators/auth.decorator';
import { RagService } from '../services/rag.service';
import { QueryRAGDto, RAGResponseDto, IngestStatusDto, IngestKnowledgeBaseDto } from '../dto/rag.dto';

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
  @ApiOperation({ summary: 'Ask a question — searches course content, knowledge base, or uses general AI knowledge' })
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

  @Post('ingest/course/:id/stream')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @ApiOperation({ summary: 'Admin: Ingest all content for a course with SSE progress stream' })
  async ingestCourseStream(@Param('id') courseId: string, @Res() res: Response) {
    this.ensureApiKeyConfigured();
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const progressCallback = (progress: number, message: string) => {
      res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      progressCallback(1, 'Starting course ingestion...');
      await this.ragService.ingestCourse(courseId, progressCallback);
      res.write(`data: ${JSON.stringify({ progress: 100, message: 'Ingestion complete', complete: true })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' })}\n\n`);
    } finally {
      res.end();
    }
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

  @Post('ingest/lesson/:id/stream')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @ApiOperation({ summary: 'Admin: Ingest content for a single lesson with SSE progress stream' })
  async ingestLessonStream(@Param('id') lessonId: string, @Res() res: Response) {
    this.ensureApiKeyConfigured();
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const progressCallback = (progress: number, message: string) => {
      res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      progressCallback(1, 'Starting lesson ingestion...');
      await this.ragService.ingestLesson(lessonId, progressCallback);
      res.write(`data: ${JSON.stringify({ progress: 100, message: 'Ingestion complete', complete: true })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post('ingest/knowledge-base')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin: Ingest knowledge base content (project docs, FAQs, platform info)' })
  @ApiResponse({ status: 200, description: 'Knowledge base ingestion complete' })
  async ingestKnowledgeBase(@Body() dto: IngestKnowledgeBaseDto): Promise<{ message: string }> {
    this.ensureApiKeyConfigured();
    await this.ragService.ingestKnowledgeBase(dto.title, dto.content, dto.category);
    return { message: `Knowledge base ingestion complete for "${dto.title}"` };
  }

  @Post('ingest/knowledge-base/stream')
  @ApiBearerAuth()
  @Auth('action:admin:rag:ingest')
  @ApiOperation({ summary: 'Admin: Ingest knowledge base content with SSE progress stream' })
  async ingestKnowledgeBaseStream(@Body() dto: IngestKnowledgeBaseDto, @Res() res: Response) {
    this.ensureApiKeyConfigured();
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const progressCallback = (progress: number, message: string) => {
      res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    };

    try {
      progressCallback(1, 'Starting knowledge base ingestion...');
      await this.ragService.ingestKnowledgeBase(dto.title, dto.content, dto.category, progressCallback);
      res.write(`data: ${JSON.stringify({ progress: 100, message: 'Ingestion complete', complete: true })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' })}\n\n`);
    } finally {
      res.end();
    }
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

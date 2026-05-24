import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RagService } from '../services/rag.service';
import { EmbeddingService } from '../services/embedding.service';
import { TranscriptionService } from '../services/transcription.service';
import { LlmService } from '../services/llm.service';
import { SupabaseClient } from '@supabase/supabase-js';

describe('RagService', () => {
  let service: RagService;
  let ragRepo: any;
  let embeddingService: jest.Mocked<EmbeddingService>;
  let transcriptionService: jest.Mocked<TranscriptionService>;
  let llmService: jest.Mocked<LlmService>;
  let supabase: any;

  beforeEach(async () => {
    ragRepo = {
      matchDocuments: jest.fn(),
      saveTranscript: jest.fn(),
      getIngestionStatus: jest.fn(),
      upsertChunks: jest.fn(),
    };

    const mockEmbeddingService = {
      generateEmbedding: jest.fn(),
      generateEmbeddings: jest.fn(),
      chunkText: jest.fn(),
    };

    const mockTranscriptionService = {
      transcribeVideo: jest.fn(),
    };

    const mockLlmService = {
      generateAnswer: jest.fn(),
    };

    supabase = {
      from: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        { provide: 'IRagRepository', useValue: ragRepo },
        { provide: EmbeddingService, useValue: mockEmbeddingService as any },
        { provide: TranscriptionService, useValue: mockTranscriptionService as any },
        { provide: LlmService, useValue: mockLlmService as any },
        { provide: SupabaseClient, useValue: supabase },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    embeddingService = module.get(EmbeddingService) as any;
    transcriptionService = module.get(TranscriptionService) as any;
    llmService = module.get(LlmService) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('query', () => {
    it('should query the RAG system and return an answer and sources', async () => {
      embeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2]);
      ragRepo.matchDocuments.mockResolvedValue([
        {
          lessonId: '1',
          courseId: '1',
          content: 'Test content',
          sourceType: 'text',
          similarity: 0.9,
          metadata: {},
        },
      ]);
      llmService.generateAnswer.mockResolvedValue('This is the answer');

      const res = await service.query('What is testing?', '1', 5);

      expect(res.answer).toBe('This is the answer');
      expect(res.sources.length).toBe(1);
      expect(embeddingService.generateEmbedding).toHaveBeenCalledWith('What is testing?');
      expect(ragRepo.matchDocuments).toHaveBeenCalledWith([0.1, 0.2], 5, '1');
    });
  });

  describe('ingestCourse', () => {
    it('should fetch course and lessons and ingest them', async () => {
      const mockLessons = [
        { id: '1', title: 'L1', content: 'C1', video_url: null, transcript: null },
      ];
      const mockCourse = { title: 'Course', description: 'Desc' };

      supabase.from.mockImplementation((table: string) => {
        if (table === 'lessons') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockLessons, error: null }),
          };
        }
        if (table === 'courses') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCourse, error: null }),
          };
        }
      });

      embeddingService.chunkText.mockReturnValue(['chunk']);
      embeddingService.generateEmbeddings.mockResolvedValue([[0.1]]);

      await service.ingestCourse('1');

      expect(ragRepo.upsertChunks).toHaveBeenCalled();
    });

    it('should throw if lessons fetch fails', async () => {
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
      }));
      await expect(service.ingestCourse('1')).rejects.toThrow('error');
    });
  });

  describe('ingestLesson', () => {
    it('should ingest a single lesson', async () => {
      const mockLesson = { id: '1', course_id: '1', title: 'L1', content: 'C1', video_url: 'http://video', transcript: 'T1' };
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLesson, error: null }),
      }));

      embeddingService.chunkText.mockReturnValue(['chunk']);
      embeddingService.generateEmbeddings.mockResolvedValue([[0.1]]);

      await service.ingestLesson('1');

      expect(ragRepo.upsertChunks).toHaveBeenCalled();
    });

    it('should throw if lesson fetch fails', async () => {
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
      }));
      await expect(service.ingestLesson('1')).rejects.toThrow();
    });
  });

  describe('transcribeLesson', () => {
    it('should force re-transcription', async () => {
      const mockLesson = { id: '1', course_id: '1', title: 'L1', video_url: 'http://video' };
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLesson, error: null }),
      }));

      transcriptionService.transcribeVideo.mockResolvedValue({
        fullText: 'full',
        segments: [{ text: 's1', timestampStart: '00:00', timestampEnd: '00:30' }],
      });
      embeddingService.generateEmbeddings.mockResolvedValue([[0.1]]);

      await service.transcribeLesson('1');

      expect(transcriptionService.transcribeVideo).toHaveBeenCalledWith('http://video');
      expect(ragRepo.saveTranscript).toHaveBeenCalledWith('1', 'full');
      expect(ragRepo.upsertChunks).toHaveBeenCalled();
    });

    it('should throw if no video url', async () => {
      const mockLesson = { id: '1', course_id: '1', title: 'L1', video_url: null };
      supabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockLesson, error: null }),
      }));

      await expect(service.transcribeLesson('1')).rejects.toThrow('has no video URL');
    });
  });

  describe('getIngestionStatus', () => {
    it('should return status', async () => {
      ragRepo.getIngestionStatus.mockResolvedValue({ totalChunks: 10, textChunks: 5, videoTranscriptChunks: 5, lastUpdated: null });
      const res = await service.getIngestionStatus('1');
      expect(res.courseId).toBe('1');
      expect(res.totalChunks).toBe(10);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { RagController } from '../controllers/rag.controller';
import { RagService } from '../services/rag.service';
import { AuthGuard } from '../../iam/guards/auth.guard';
import { PermissionGuard } from '../../iam/guards/permission.guard';

describe('RagController', () => {
  let controller: RagController;
  let ragService: jest.Mocked<RagService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockRagService = {
      query: jest.fn(),
      ingestCourse: jest.fn(),
      ingestLesson: jest.fn(),
      getIngestionStatus: jest.fn(),
      transcribeLesson: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RagController],
      providers: [
        {
          provide: RagService,
          useValue: mockRagService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<RagController>(RagController);
    ragService = module.get(RagService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ensureApiKeyConfigured', () => {
    it('should throw BadRequestException if GEMINI_API_KEY is not set', async () => {
      configService.get.mockReturnValue(undefined);
      await expect(
        controller.query({ question: 'test', courseId: '1', maxResults: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should proceed if GEMINI_API_KEY is set', async () => {
      configService.get.mockReturnValue('test-key');
      ragService.query.mockResolvedValue({ answer: 'test', sources: [] });
      const result = await controller.query({ question: 'test', courseId: '1', maxResults: 5 });
      expect(result).toBeDefined();
    });
  });

  describe('query', () => {
    it('should call ragService.query', async () => {
      configService.get.mockReturnValue('test-key');
      ragService.query.mockResolvedValue({ answer: 'test', sources: [] });
      await controller.query({ question: 'test', courseId: '1', maxResults: 3 });
      expect(ragService.query).toHaveBeenCalledWith('test', '1', 3);
    });
  });

  describe('ingestCourse', () => {
    it('should call ragService.ingestCourse', async () => {
      configService.get.mockReturnValue('test-key');
      ragService.ingestCourse.mockResolvedValue(undefined);
      const res = await controller.ingestCourse('1');
      expect(ragService.ingestCourse).toHaveBeenCalledWith('1');
      expect(res.message).toContain('Ingestion complete');
    });
  });

  describe('ingestLesson', () => {
    it('should call ragService.ingestLesson', async () => {
      configService.get.mockReturnValue('test-key');
      ragService.ingestLesson.mockResolvedValue(undefined);
      const res = await controller.ingestLesson('1');
      expect(ragService.ingestLesson).toHaveBeenCalledWith('1');
      expect(res.message).toContain('Ingestion complete');
    });
  });

  describe('getStatus', () => {
    it('should call ragService.getIngestionStatus', async () => {
      configService.get.mockReturnValue('test-key');
      const mockStatus = { courseId: '1', totalChunks: 10, textChunks: 5, videoTranscriptChunks: 5, lastUpdated: null };
      ragService.getIngestionStatus.mockResolvedValue(mockStatus);
      const res = await controller.getStatus('1');
      expect(ragService.getIngestionStatus).toHaveBeenCalledWith('1');
      expect(res).toEqual(mockStatus);
    });
  });

  describe('transcribeLesson', () => {
    it('should call ragService.transcribeLesson', async () => {
      configService.get.mockReturnValue('test-key');
      ragService.transcribeLesson.mockResolvedValue(undefined);
      const res = await controller.transcribeLesson('1');
      expect(ragService.transcribeLesson).toHaveBeenCalledWith('1');
      expect(res.message).toContain('Transcription complete');
    });
  });
});

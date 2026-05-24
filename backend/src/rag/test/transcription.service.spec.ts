import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { TranscriptionService } from '../services/transcription.service';

const mockUpload = jest.fn();
const mockGet = jest.fn();
const mockDelete = jest.fn();
const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        files: {
          upload: mockUpload,
          get: mockGet,
          delete: mockDelete,
        },
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  let configService: jest.Mocked<ConfigService>;
  let mockSupabaseClient: any;
  let mockDownload: jest.Mock;

  beforeEach(async () => {
    mockUpload.mockClear();
    mockGet.mockClear();
    mockDelete.mockClear();
    mockGenerateContent.mockClear();

    mockDownload = jest.fn();

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-key';
        return undefined;
      }),
    };

    mockSupabaseClient = {
      storage: {
        from: jest.fn().mockReturnValue({
          download: mockDownload,
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SupabaseClient,
          useValue: mockSupabaseClient,
        },
      ],
    }).compile();

    service = module.get<TranscriptionService>(TranscriptionService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if GEMINI_API_KEY is missing', () => {
      configService.get.mockImplementation(() => undefined);
      expect(() => new TranscriptionService(configService, mockSupabaseClient)).toThrow();
    });
  });

  describe('transcribeVideo', () => {
    it('should successfully transcribe a video', async () => {
      // Mock Supabase download
      mockDownload.mockResolvedValue({
        data: {
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
          type: 'video/mp4',
        },
        error: null,
      });

      // Mock upload
      mockUpload.mockResolvedValue({ name: 'files/test', state: 'PROCESSING' });
      mockGet.mockResolvedValue({ name: 'files/test', state: 'ACTIVE', uri: 'gs://test' });

      // Mock LLM
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          segments: [{ text: 'test segment', timestampStart: '00:00', timestampEnd: '00:30' }],
        }),
      });

      const res = await service.transcribeVideo('videos/test.mp4');

      expect(res.fullText).toBe('test segment');
      expect(res.segments.length).toBe(1);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should handle download failure', async () => {
      mockDownload.mockResolvedValue({ data: null, error: new Error('Not found') });
      await expect(service.transcribeVideo('videos/test.mp4')).rejects.toThrow();
    });

    it('should handle file processing failure', async () => {
      mockDownload.mockResolvedValue({
        data: {
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
          type: 'video/mp4',
        },
        error: null,
      });

      mockUpload.mockResolvedValue({ name: 'files/test', state: 'PROCESSING' });
      mockGet.mockResolvedValue({ name: 'files/test', state: 'FAILED' });

      await expect(service.transcribeVideo('videos/test.mp4')).rejects.toThrow();
    });

    it('should fallback to plain text if JSON parsing fails', async () => {
      mockDownload.mockResolvedValue({
        data: {
          arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
          type: 'video/mp4',
        },
        error: null,
      });

      mockUpload.mockResolvedValue({ name: 'files/test', state: 'ACTIVE', uri: 'gs://test' });
      mockGenerateContent.mockResolvedValue({ text: 'just some plain text' });

      const res = await service.transcribeVideo('videos/test.mp4');
      expect(res.fullText).toBe('just some plain text');
      expect(res.segments[0].text).toBe('just some plain text');
    });
  });
});

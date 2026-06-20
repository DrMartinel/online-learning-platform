import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../services/llm.service';

const mockGenerateContent = jest.fn();

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
  };
});

describe('LlmService', () => {
  let service: LlmService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockGenerateContent.mockClear();

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-key';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if GEMINI_API_KEY is missing', () => {
      configService.get.mockImplementation((key: string) => undefined);
      expect(() => new LlmService(configService)).toThrow();
    });
  });

  describe('generateAnswer', () => {
    it('should return fallback message if no context chunks provided', async () => {
      mockGenerateContent.mockResolvedValue({ text: "I don't have enough information." });
      const answer = await service.generateAnswer('test question', []);
      expect(answer).toContain('I don\'t have enough information');
    });

    it('should generate answer from context chunks', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'This is the generated answer.' });
      const chunks = [
        {
          content: 'test content 1',
          sourceType: 'text',
          metadata: {},
        },
        {
          content: 'test content 2',
          sourceType: 'video_transcript',
          metadata: { timestamp_start: '00:01:00' },
        },
      ];
      
      const answer = await service.generateAnswer('test question', chunks);
      expect(answer).toBe('This is the generated answer.');
      expect(mockGenerateContent).toHaveBeenCalled();
      
      const callArg = mockGenerateContent.mock.calls[0][0].contents;
      expect(callArg).toContain('test content 1');
      expect(callArg).toContain('test content 2');
      expect(callArg).toContain('[Video Transcript at 00:01:00]');
    });

    it('should return fallback if no text in result', async () => {
      mockGenerateContent.mockResolvedValue({ text: undefined });
      const chunks = [
        {
          content: 'test content 1',
          sourceType: 'text',
          metadata: {},
        },
      ];
      const answer = await service.generateAnswer('test question', chunks);
      expect(answer).toContain('unable to generate an answer');
    });
  });
});

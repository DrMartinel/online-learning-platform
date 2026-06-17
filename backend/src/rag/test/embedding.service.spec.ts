import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from '../services/embedding.service';

const mockEmbedContent = jest.fn();

jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          embedContent: mockEmbedContent,
        },
      };
    }),
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockEmbedContent.mockClear();
    
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-key';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if GEMINI_API_KEY is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return undefined;
        return undefined;
      });
      expect(() => new EmbeddingService(configService)).toThrow();
    });
  });

  describe('generateEmbedding', () => {
    it('should return embedding array', async () => {
      mockEmbedContent.mockResolvedValue({
        embeddings: [{ values: [0.1, 0.2, 0.3] }],
      });
      const res = await service.generateEmbedding('test');
      expect(res).toEqual([0.1, 0.2, 0.3]);
    });

    it('should throw error if no embedding returned', async () => {
      mockEmbedContent.mockResolvedValue({ embeddings: [] });
      await expect(service.generateEmbedding('test')).rejects.toThrow();
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate multiple embeddings', async () => {
      mockEmbedContent
        .mockResolvedValueOnce({ embeddings: [{ values: [0.1] }] })
        .mockResolvedValueOnce({ embeddings: [{ values: [0.2] }] });
      const res = await service.generateEmbeddings(['t1', 't2']);
      expect(res).toEqual([[0.1], [0.2]]);
      expect(mockEmbedContent).toHaveBeenCalledTimes(2);
    });
  });

  describe('chunkText', () => {
    it('should return empty array for empty text', () => {
      expect(service.chunkText('')).toEqual([]);
    });

    it('should return single chunk if text is smaller than chunkSize', () => {
      expect(service.chunkText('short text')).toEqual(['short text']);
    });

    it('should chunk longer text', () => {
      // Assuming default chunk size 500, we'll pass maxChunkSize for testing
      const text = 'a'.repeat(200);
      const chunks = service.chunkText(text, 100);
      expect(chunks.length).toBeGreaterThan(1);
    });
  });
});

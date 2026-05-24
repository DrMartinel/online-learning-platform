import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly dimensions: number;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for the RAG module');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.model = this.configService.get<string>('RAG_EMBEDDING_MODEL') || 'gemini-embedding-001';
    this.dimensions = parseInt(this.configService.get<string>('RAG_EMBEDDING_DIMENSIONS') || '768', 10);
    this.chunkSize = parseInt(this.configService.get<string>('RAG_CHUNK_SIZE') || '500', 10);
    this.chunkOverlap = parseInt(this.configService.get<string>('RAG_CHUNK_OVERLAP') || '50', 10);
  }

  /**
   * Generate an embedding for a single text string.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.ai.models.embedContent({
      model: this.model,
      contents: text,
      config: {
        outputDimensionality: this.dimensions,
      },
    });

    if (!result.embeddings || result.embeddings.length === 0) {
      throw new Error('No embedding returned from Gemini');
    }

    return result.embeddings[0].values as number[];
  }

  /**
   * Generate embeddings for multiple texts (sequential to respect rate limits).
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Split text into chunks with overlap.
   * Uses character-based splitting with sentence boundary awareness.
   */
  chunkText(text: string, maxChunkSize?: number): string[] {
    const chunkSize = maxChunkSize || this.chunkSize;
    const overlap = this.chunkOverlap;

    if (!text || text.trim().length === 0) {
      return [];
    }

    const cleanedText = text.trim();

    // If text fits in a single chunk, return it as-is
    if (cleanedText.length <= chunkSize) {
      return [cleanedText];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < cleanedText.length) {
      let end = start + chunkSize;

      if (end >= cleanedText.length) {
        chunks.push(cleanedText.slice(start).trim());
        break;
      }

      // Try to break at sentence boundaries (., !, ?, newline)
      const searchWindow = cleanedText.slice(
        Math.max(start + chunkSize - 100, start),
        end,
      );
      const lastSentenceEnd = Math.max(
        searchWindow.lastIndexOf('. '),
        searchWindow.lastIndexOf('! '),
        searchWindow.lastIndexOf('? '),
        searchWindow.lastIndexOf('\n'),
      );

      if (lastSentenceEnd > 0) {
        end = start + chunkSize - 100 + lastSentenceEnd + 2;
        if (end <= start) end = start + chunkSize;
      }

      chunks.push(cleanedText.slice(start, end).trim());
      start = end - overlap;
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }
}

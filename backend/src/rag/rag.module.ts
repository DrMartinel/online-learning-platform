import { Module } from '@nestjs/common';
import { RagController } from './controllers/rag.controller';
import { RagService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { TranscriptionService } from './services/transcription.service';
import { LlmService } from './services/llm.service';
import { SupabaseRagRepository } from './repositories/supabase-rag.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [RagController],
  providers: [
    RagService,
    {
      provide: EmbeddingService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          // Return a stub that throws on use — module loads but operations fail gracefully
          return new Proxy({} as EmbeddingService, {
            get: (_, prop) => {
              if (prop === 'chunkText') {
                // chunkText doesn't need API key
                return (text: string) => [text];
              }
              return () => {
                throw new Error('RAG system is not configured. Please set GEMINI_API_KEY.');
              };
            },
          });
        }
        return new EmbeddingService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: TranscriptionService,
      useFactory: (configService: ConfigService, supabaseClient: SupabaseClient) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          return new Proxy({} as TranscriptionService, {
            get: () => () => {
              throw new Error('RAG system is not configured. Please set GEMINI_API_KEY.');
            },
          });
        }
        return new TranscriptionService(configService, supabaseClient);
      },
      inject: [ConfigService, SupabaseClient],
    },
    {
      provide: LlmService,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          return new Proxy({} as LlmService, {
            get: () => () => {
              throw new Error('RAG system is not configured. Please set GEMINI_API_KEY.');
            },
          });
        }
        return new LlmService(configService);
      },
      inject: [ConfigService],
    },
    {
      provide: 'IRagRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseRagRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
})
export class RagModule {}

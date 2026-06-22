import { Module } from '@nestjs/common';
import { RagController } from './controllers/rag.controller';
import { RagService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { TranscriptionService } from './services/transcription.service';
import { LlmService } from './services/llm.service';
import { SupabaseRagRepository } from './repositories/supabase-rag.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

const createStubProxy = <T extends object>(serviceName: string, overrides: Record<string | symbol, any> = {}): T => {
  const specialProps = new Set([
    'onModuleInit',
    'onApplicationBootstrap',
    'onModuleDestroy',
    'beforeApplicationShutdown',
    'onApplicationShutdown',
    'then',
    'constructor',
    'prototype',
  ]);

  return new Proxy({} as T, {
    get: (target, prop) => {
      if (prop in overrides) {
        return overrides[prop];
      }
      if (typeof prop === 'symbol' || specialProps.has(prop as string)) {
        return target[prop as keyof T];
      }
      return () => {
        throw new Error('RAG system is not configured. Please set GEMINI_API_KEY.');
      };
    },
  });
};

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
          return createStubProxy<EmbeddingService>('EmbeddingService', {
            chunkText: (text: string) => [text],
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
          return createStubProxy<TranscriptionService>('TranscriptionService');
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
          return createStubProxy<LlmService>('LlmService');
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

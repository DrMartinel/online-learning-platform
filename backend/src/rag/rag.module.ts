import { Module } from '@nestjs/common';
import { RagController } from './controllers/rag.controller';
import { RagService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { TranscriptionService } from './services/transcription.service';
import { LlmService } from './services/llm.service';
import { SupabaseRagRepository } from './repositories/supabase-rag.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

// Properties that must return undefined so NestJS lifecycle hooks and Promise
// resolution do not accidentally invoke the stub and crash on startup.
const RAG_STUB_PASS_THROUGH = new Set([
  'then', 'catch', 'finally',
  'onModuleInit', 'onModuleDestroy',
  'onApplicationBootstrap', 'beforeApplicationShutdown', 'onApplicationShutdown',
]);

function makeRagStub<T extends object>(overrides: Partial<Record<string, unknown>> = {}): T {
  return new Proxy({} as T, {
    get: (_, prop) => {
      if (typeof prop === 'symbol') return undefined;
      if (RAG_STUB_PASS_THROUGH.has(prop as string)) return undefined;
      if (prop in overrides) return overrides[prop as string];
      return () => {
        throw new Error('RAG system is not configured. Please set GEMINI_API_KEY.');
      };
    },
  });
}

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
          return makeRagStub<EmbeddingService>({ chunkText: (text: string) => [text] });
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
          return makeRagStub<TranscriptionService>();
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
          return makeRagStub<LlmService>();
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

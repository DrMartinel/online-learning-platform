import { Module } from '@nestjs/common';
import { ChapterController } from './controllers/chapter.controller';
import { ChapterService } from './services/chapter.service';
import { SupabaseChapterRepository } from './repositories/supabase-chapter.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [ChapterController],
  providers: [
    ChapterService,
    {
      provide: 'IChapterRepository',
      useFactory: (client: SupabaseClient) => new SupabaseChapterRepository(client),
      inject: [SupabaseClient],
    },
  ],
  exports: [ChapterService],
})
export class ChapterModule {}

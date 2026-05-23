import { Module } from '@nestjs/common';
import { LessonService } from './services/lesson.service';
import { LessonController } from './controllers/lesson.controller';
import { SupabaseLessonRepository } from './repositories/supabase-lesson.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [LessonController],
  providers: [
    LessonService,
    {
      provide: 'ILessonRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseLessonRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
})
export class LessonModule {}

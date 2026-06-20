import { Module } from '@nestjs/common';
import { LessonService } from './services/lesson.service';
import { LessonController } from './controllers/lesson.controller';
import { LessonAdminController } from './controllers/admin/lesson.admin.controller';
import { LessonContentController } from './controllers/lesson-content.controller';
import { LessonContentService } from './services/lesson-content.service';
import { SupabaseLessonRepository } from './repositories/supabase-lesson.repository';
import { SupabaseLessonContentRepository } from './repositories/supabase-lesson-content.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { CourseModule } from '../course/course.module'; 
import { DatabaseModule } from '../database/database.module'; 

@Module({
  imports: [CourseModule, DatabaseModule],
  controllers: [LessonController, LessonAdminController, LessonContentController],
  providers: [
    LessonService,
    LessonContentService,
    {
      provide: 'ILessonRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseLessonRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
    {
      provide: 'ILessonContentRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseLessonContentRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
  exports: [LessonService, LessonContentService],
})
export class LessonModule {}

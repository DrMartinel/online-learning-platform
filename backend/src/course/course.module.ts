import { Module } from '@nestjs/common';
import { CourseService } from './services/course.service';
import { CourseController } from './controllers/course.controller';
import { SupabaseCourseRepository } from './repositories/supabase-course.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [CourseController],
  providers: [
    CourseService,
    {
      provide: 'ICourseRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseCourseRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
})
export class CourseModule {}

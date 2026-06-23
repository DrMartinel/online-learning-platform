import { Module } from '@nestjs/common';
import { CourseService } from './services/course.service';
import { CourseController } from './controllers/course.controller';
import { CourseAdminController } from './controllers/admin/course.admin.controller';
import { SupabaseCourseRepository } from './repositories/supabase-course.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCourseExamRepository } from './repositories/supabase-course-exam.repository';

@Module({
  imports: [],
  controllers: [CourseController, CourseAdminController],
  providers: [
    CourseService,
    {
      provide: 'ICourseRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseCourseRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
    {
      provide: 'ICourseExamRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseCourseExamRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
  exports: [CourseService],
})
export class CourseModule {}

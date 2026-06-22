import { Module } from '@nestjs/common';
import { CourseReviewService } from './services/course-review.service';
import { CourseReviewController } from './controllers/course-review.controller';
import { CourseReviewAdminController } from './controllers/admin/course-review.admin.controller';
import { SupabaseCourseReviewRepository } from './repositories/supabase-course-review.repository';
import { SupabaseClient } from '@supabase/supabase-js';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [CourseModule],
  controllers: [CourseReviewController, CourseReviewAdminController],
  providers: [
    CourseReviewService,
    {
      provide: 'ICourseReviewRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseCourseReviewRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
  exports: [CourseReviewService],
})
export class CourseReviewModule {}

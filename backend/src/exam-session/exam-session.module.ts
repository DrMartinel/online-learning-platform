import { Module } from '@nestjs/common';
import { ExamSessionService } from './services/exam-session.service';
import { AdminExamSessionController } from './controllers/admin-exam-session.controller';
import { StudentExamSessionController } from './controllers/student-exam-session.controller';
import { SupabaseExamSessionRepository } from './repositories/supabase-exam-session.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [AdminExamSessionController, StudentExamSessionController],
  providers: [
    ExamSessionService,
    {
      provide: 'IExamSessionRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseExamSessionRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
  exports: [ExamSessionService],
})
export class ExamSessionModule {}

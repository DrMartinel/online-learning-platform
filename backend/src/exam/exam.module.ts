import { Module } from '@nestjs/common';
import { ExamService } from './services/exam.service';
import { ExamController } from './controllers/exam.controller';
import { SupabaseExamRepository } from './repositories/supabase-exam.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [ExamController],
  providers: [
    ExamService,
    {
      provide: 'IExamRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseExamRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
})
export class ExamModule {}

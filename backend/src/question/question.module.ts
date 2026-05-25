import { Module } from '@nestjs/common';
import { QuestionService } from './services/question.service';
import { QuestionController } from './controllers/question.controller';
import { SupabaseQuestionRepository } from './repositories/supabase-question.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [QuestionController],
  providers: [
    QuestionService,
    {
      provide: 'IQuestionRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseQuestionRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
  exports: [QuestionService],
})
export class QuestionModule {}

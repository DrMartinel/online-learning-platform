import { Module } from '@nestjs/common';
import { CommentController } from './controllers/comment.controller';
import { CommentService } from './services/comment.service';
import { SupabaseCommentRepository } from './repositories/supabase-comment.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [CommentController],
  providers: [
    CommentService,
    {
      provide: 'ICommentRepository',
      useFactory: (client: SupabaseClient) => new SupabaseCommentRepository(client),
      inject: [SupabaseClient],
    },
  ],
  exports: [CommentService],
})
export class CommentModule {}

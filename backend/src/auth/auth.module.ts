import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { SupabaseAuthRepository } from './repositories/supabase-auth.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'IAuthRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseAuthRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
})
export class AuthModule {}

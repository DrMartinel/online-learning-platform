import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { SupabaseAuthRepository } from './repositories/supabase-auth.repository';
import { createClient } from '@supabase/supabase-js';
import * as ws from 'ws';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'IAuthRepository',
      useFactory: () => {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';
        const supabaseKey = process.env.SERVICE_ROLE_KEY || '';
        const authClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
          },
          realtime: {
            transport: ws as any,
          },
        });
        return new SupabaseAuthRepository(authClient);
      },
    },
  ],
})
export class AuthModule {}



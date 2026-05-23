import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { UserAdminController } from './controllers/admin/user.admin.controller';
import { SupabaseUserRepository } from './repositories/supabase-user.repository';
import { UserProgressService } from './services/user-progress.service';
import { UserProgressController } from './controllers/user-progress.controller';
import { SupabaseUserProgressRepository } from './repositories/supabase-user-progress.repository';
import { SupabaseClient } from '@supabase/supabase-js';

@Module({
  controllers: [UserController, UserProgressController, UserAdminController],
  providers: [
    UserService,
    UserProgressService,
    {
      provide: 'IUserRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseUserRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
    {
      provide: 'IUserProgressRepository',
      useFactory: (supabaseClient: SupabaseClient) => {
        return new SupabaseUserProgressRepository(supabaseClient);
      },
      inject: [SupabaseClient],
    },
  ],
})
export class UserModule {}

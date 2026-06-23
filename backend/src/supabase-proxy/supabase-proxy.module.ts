import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseProxyService } from './supabase-proxy.service';
import { SupabaseProxyController } from './supabase-proxy.controller';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseProxyService],
  controllers: [SupabaseProxyController],
  exports: [SupabaseProxyService],
})
export class SupabaseProxyModule {}

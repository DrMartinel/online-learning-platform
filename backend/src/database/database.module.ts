import { Global, Module } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ws from 'ws';

const supabaseProvider = {
  provide: SupabaseClient,
  useFactory: () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';
    const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      realtime: {
        transport: ws as any,
      },
    });
  },
};

@Global()
@Module({
  providers: [supabaseProvider],
  exports: [SupabaseClient],
})
export class DatabaseModule {}

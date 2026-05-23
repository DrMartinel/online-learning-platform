import { Global, Module } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseProvider = {
  provide: SupabaseClient,
  useFactory: () => {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
  },
};

@Global()
@Module({
  providers: [supabaseProvider],
  exports: [SupabaseClient],
})
export class DatabaseModule {}

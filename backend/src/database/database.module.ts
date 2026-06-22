import { Global, Module } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ws from 'ws';

const supabaseProvider = {
  provide: SupabaseClient,
  useFactory: () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';
    const supabaseKey = process.env.SERVICE_ROLE_KEY;
    if (!supabaseKey) {
      throw new Error('SERVICE_ROLE_KEY environment variable is required. The backend must connect with the service_role to access IAM tables and admin APIs.');
    }
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

import { Global, Module } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as ws from 'ws';

const supabaseProvider = {
  provide: SupabaseClient,
  useFactory: async () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PUBLIC_URL || '';
    const supabaseKey = process.env.SERVICE_ROLE_KEY;
    if (!supabaseKey) {
      throw new Error('SERVICE_ROLE_KEY environment variable is required. The backend must connect with the service_role to access IAM tables and admin APIs.');
    }
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      realtime: {
        transport: ws as any,
      },
    });

    // Ensure course-media bucket exists and is public
    try {
      console.log('Verifying course-media bucket in Supabase Storage...');
      const { data: buckets, error: listError } = await client.storage.listBuckets();
      if (listError) throw listError;

      const hasBucket = buckets?.some(b => b.id === 'course-media');
      if (!hasBucket) {
        console.log('Bucket "course-media" does not exist. Creating it now...');
        const { error: createError } = await client.storage.createBucket('course-media', { public: true });
        if (createError) throw createError;
        console.log('Successfully created public bucket "course-media".');
      } else {
        const target = buckets?.find(b => b.id === 'course-media');
        if (target && !target.public) {
          console.log('Bucket "course-media" exists but is not public. Updating to public...');
          const { error: updateError } = await client.storage.updateBucket('course-media', { public: true });
          if (updateError) throw updateError;
          console.log('Successfully updated bucket "course-media" to public.');
        } else {
          console.log('Bucket "course-media" is already verified and active.');
        }
      }
    } catch (e: any) {
      console.error('Failed to self-heal/initialize Supabase Storage buckets:', e.message || e);
    }

    return client;
  },
};

@Global()
@Module({
  providers: [supabaseProvider],
  exports: [SupabaseClient],
})
export class DatabaseModule {}

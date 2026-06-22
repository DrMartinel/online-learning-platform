import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SupabaseClient } from '@supabase/supabase-js';

async function bootstrap() {
  const email = process.env.ADMIN_EMAIL || 'admin@olp.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';
  const fullName = process.env.ADMIN_NAME || 'System Administrator';

  console.log(`Initializing Admin Account creation for ${email}...`);
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseClient);

  // 1. Create the user in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) {
    console.error('Error creating auth user:', authError.message);
    await app.close();
    process.exit(1);
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('No user ID returned from Supabase Auth.');
    await app.close();
    process.exit(1);
  }

  console.log(`Auth user created successfully with ID: ${userId}`);

  // Wait a brief moment for the Supabase trigger to insert the profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Fetch the admin role ID
  const { data: roleData, error: roleError } = await supabase
    .from('iam_roles')
    .select('id')
    .eq('urn', 'role:user:admin')
    .single();

  if (roleError || !roleData) {
    console.error('Error fetching admin role ID:', roleError?.message || 'Role not found');
    await app.close();
    process.exit(1);
  }

  const adminRoleId = (roleData as any).id;

  // 3. Update iam_user_roles to assign admin role
  // First clear any automatically assigned roles
  await supabase.from('iam_user_roles').delete().eq('user_id', userId);

  // Insert admin role
  const { error: assignError } = await supabase
    .from('iam_user_roles')
    .insert({ user_id: userId, role_id: adminRoleId } as any);

  if (assignError) {
    console.error('Error assigning admin role:', assignError.message);
    await app.close();
    process.exit(1);
  }

  console.log(`Admin role successfully assigned to user ${email}!`);
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Failed to create admin user:', err);
  process.exit(1);
});

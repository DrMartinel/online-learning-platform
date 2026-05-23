import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_ROLES } from '../iam/iam.constants';

async function bootstrap() {
  console.log('Bootstrapping IAM data loader...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseClient);

  console.log('Connected to Supabase. Seeding IAM data...');

  // Upsert all required permissions first
  const allPermissions = new Set<string>();
  Object.values(DEFAULT_ROLES).forEach(perms => perms.forEach(p => allPermissions.add(p)));

  console.log(`Found ${allPermissions.size} unique permissions to upsert.`);

  for (const perm of Array.from(allPermissions)) {
    const { error } = await supabase
      .from('iam_permissions')
      .upsert({ urn: perm, description: `Auto-generated permission: ${perm}` } as any, { onConflict: 'urn' });
    if (error) {
      console.error(`Error upserting permission ${perm}:`, error);
    }
  }

  // Upsert roles and map permissions
  for (const [roleUrn, permissions] of Object.entries(DEFAULT_ROLES)) {
    console.log(`Processing role: ${roleUrn}`);
    const { data: roleData, error: roleError } = await supabase
      .from('iam_roles')
      .upsert({ urn: roleUrn, description: `Auto-generated role: ${roleUrn}` } as any, { onConflict: 'urn' })
      .select('id')
      .single();

    if (roleError || !roleData) {
      console.error(`Error upserting role ${roleUrn}:`, roleError);
      continue;
    }

    const roleId = (roleData as any).id;

    if (permissions.length > 0) {
      // Get all permission IDs for this role
      const { data: permRecords, error: permError } = await supabase
        .from('iam_permissions')
        .select('id')
        .in('urn', permissions);

      if (permError || !permRecords) {
        console.error(`Error fetching permission IDs for role ${roleUrn}:`, permError);
        continue;
      }

      // Upsert mappings
      for (const perm of permRecords) {
        const { error: mappingError } = await supabase
          .from('iam_role_permissions')
          .upsert({ role_id: roleId, permission_id: (perm as any).id } as any, { onConflict: 'role_id,permission_id' });
        if (mappingError) {
          console.error(`Error linking permission ${(perm as any).id} to role ${roleUrn}:`, mappingError);
        }
      }
    }
  }

  // Ensure Admin role has all permissions just in case
  console.log('Ensuring role:user:admin has ALL permissions...');
  const { data: adminRoleData } = await supabase
    .from('iam_roles')
    .upsert({ urn: 'role:user:admin', description: 'Admin role with full access' } as any, { onConflict: 'urn' })
    .select('id')
    .single();

  if (adminRoleData) {
    const { data: allPermRecords } = await supabase.from('iam_permissions').select('id');
    if (allPermRecords) {
      for (const perm of allPermRecords) {
        await supabase
          .from('iam_role_permissions')
          .upsert({ role_id: (adminRoleData as any).id, permission_id: (perm as any).id } as any, { onConflict: 'role_id,permission_id' });
      }
    }
  }

  console.log('IAM data seeding complete!');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Failed to load IAM data:', err);
  process.exit(1);
});

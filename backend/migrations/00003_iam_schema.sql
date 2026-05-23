-- Create IAM Roles table
CREATE TABLE IF NOT EXISTS public.iam_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urn VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create IAM Permissions table
CREATE TABLE IF NOT EXISTS public.iam_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urn VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Join table for Roles <-> Permissions
CREATE TABLE IF NOT EXISTS public.iam_role_permissions (
    role_id UUID REFERENCES public.iam_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.iam_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- Join table for Users <-> Roles
CREATE TABLE IF NOT EXISTS public.iam_user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.iam_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- Enable RLS
ALTER TABLE public.iam_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iam_user_roles ENABLE ROW LEVEL SECURITY;

-- Only allow service role (or postgres) to bypass RLS to manage these.
-- Since the backend service connects with admin privileges (postgres user), it bypasses RLS.
-- Normal authenticated users have no RLS policies on these tables, meaning they cannot select or modify them directly via PostgREST. This is secure since the backend handles it.

-- Seed some default data (optional but helpful)
INSERT INTO public.iam_roles (urn, description) VALUES
  ('role:user:default', 'Default user role with minimal permissions'),
  ('role:user:admin', 'Admin role with full access')
ON CONFLICT (urn) DO NOTHING;

INSERT INTO public.iam_permissions (urn, description) VALUES
  ('action:course:create', 'Can create courses'),
  ('action:course:update', 'Can update courses'),
  ('action:course:delete', 'Can delete courses'),
  ('action:course:list', 'Can list courses'),
  ('action:course:read', 'Can read course details'),
  ('action:lesson:create', 'Can create lessons'),
  ('action:lesson:update', 'Can update lessons'),
  ('action:lesson:delete', 'Can delete lessons'),
  ('action:lesson:list', 'Can list lessons'),
  ('action:lesson:read', 'Can read lesson details'),
  ('action:user_progress:create', 'Can create user progress'),
  ('action:user_progress:read', 'Can read user progress'),
  ('action:user_progress:update', 'Can update user progress'),
  ('action:user:read:me', 'Can read own profile'),
  ('action:user:update:me', 'Can update own profile')
ON CONFLICT (urn) DO NOTHING;

-- Map admin role to all permissions
DO $$
DECLARE
    admin_role_id UUID;
    perm_record RECORD;
BEGIN
    SELECT id INTO admin_role_id FROM public.iam_roles WHERE urn = 'role:user:admin';
    
    FOR perm_record IN SELECT id FROM public.iam_permissions LOOP
        INSERT INTO public.iam_role_permissions (role_id, permission_id)
        VALUES (admin_role_id, perm_record.id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

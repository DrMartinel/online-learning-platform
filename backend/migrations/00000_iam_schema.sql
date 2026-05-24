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

-- RLS Policies for IAM tables
-- Service role gets full CRUD (used by backend for seeding and role management)
CREATE POLICY "Service role full access on iam_roles" ON public.iam_roles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on iam_permissions" ON public.iam_permissions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on iam_role_permissions" ON public.iam_role_permissions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on iam_user_roles" ON public.iam_user_roles FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read roles and permissions (needed for the PermissionGuard join query)
CREATE POLICY "Authenticated users can read roles" ON public.iam_roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read permissions" ON public.iam_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read role permissions" ON public.iam_role_permissions FOR SELECT USING (auth.role() = 'authenticated');
-- Users can only read their own role assignments
CREATE POLICY "Users can read own role assignments" ON public.iam_user_roles FOR SELECT USING (auth.uid() = user_id);

-- Note: Seeding is handled by the backend load-iam-data utility script.

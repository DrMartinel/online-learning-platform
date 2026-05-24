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
CREATE POLICY "Allow public full access on iam_roles" ON public.iam_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on iam_permissions" ON public.iam_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on iam_role_permissions" ON public.iam_role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on iam_user_roles" ON public.iam_user_roles FOR ALL USING (true) WITH CHECK (true);

-- Note: Seeding is handled by the backend load-iam-data utility script.

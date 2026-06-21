-- Migration 00013_seed_admin_user.sql
-- Creates a default admin user in auth.users and assigns the role:user:admin IAM role.
--
-- Credentials are read from environment variables injected at migration time:
--   ADMIN_EMAIL    (default: admin@example.com)
--   ADMIN_PASSWORD (default: Admin@1234)
--
-- This migration is fully idempotent: running it again when the user already
-- exists is a no-op (ON CONFLICT DO NOTHING).

DO $$
DECLARE
    v_email      TEXT := COALESCE(current_setting('app.admin_email',    true), 'admin@example.com');
    v_password   TEXT := COALESCE(current_setting('app.admin_password', true), 'Admin@1234');
    v_user_id    UUID;
    v_admin_role UUID;
BEGIN
    -- ----------------------------------------------------------------
    -- 1. Upsert the user into auth.users
    -- ----------------------------------------------------------------
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_sso_user,
        is_anonymous
    )
    SELECT
        gen_random_uuid(),                               -- id
        '00000000-0000-0000-0000-000000000000',          -- instance_id
        'authenticated',                                 -- aud
        'authenticated',                                 -- role
        v_email,                                         -- email
        crypt(v_password, gen_salt('bf')),               -- encrypted_password (bcrypt)
        NOW(),                                           -- email_confirmed_at
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', 'Admin'),
        NOW(),
        NOW(),
        false,
        false
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = v_email
    )
    RETURNING id INTO v_user_id;

    -- If user already existed, grab their ID
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
        RAISE NOTICE 'Admin user already exists (id: %), skipping creation.', v_user_id;
    ELSE
        RAISE NOTICE 'Admin user created (id: %).', v_user_id;
    END IF;

    -- ----------------------------------------------------------------
    -- 2. Ensure a profile row exists (trigger may have already fired)
    -- ----------------------------------------------------------------
    INSERT INTO public.profiles (id, full_name)
    VALUES (v_user_id, 'Admin')
    ON CONFLICT (id) DO NOTHING;

    -- ----------------------------------------------------------------
    -- 3. Look up the admin role
    -- ----------------------------------------------------------------
    SELECT id INTO v_admin_role
    FROM public.iam_roles
    WHERE urn = 'role:user:admin';

    IF v_admin_role IS NULL THEN
        RAISE WARNING 'role:user:admin not found in iam_roles — run load-iam-data first, then re-run this migration.';
        RETURN;
    END IF;

    -- ----------------------------------------------------------------
    -- 4. Assign role:user:admin (remove student role if auto-assigned)
    -- ----------------------------------------------------------------
    -- Remove any auto-assigned student role so there is no role conflict
    DELETE FROM public.iam_user_roles
    WHERE user_id = v_user_id
      AND role_id IN (
          SELECT id FROM public.iam_roles WHERE urn = 'role:user:student'
      );

    -- Grant the admin role
    INSERT INTO public.iam_user_roles (user_id, role_id)
    VALUES (v_user_id, v_admin_role)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'role:user:admin assigned to user %.', v_user_id;
END;
$$;

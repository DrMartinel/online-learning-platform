-- Migration 00001_initial_schema.sql
-- Combined from dev/data.sql and supabase_schema.sql
-- Note: The `profiles` table definitions and RLS policies were logically merged


-- 2. Create Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 3. Create Courses table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create Lessons table
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  content TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Create User Progress table
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies for Profiles
CREATE POLICY "Allow public full access on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- 8. Define RLS Policies for Courses
CREATE POLICY "Allow public full access on courses" ON courses FOR ALL USING (true) WITH CHECK (true);

-- 9. Define RLS Policies for Lessons
CREATE POLICY "Allow public full access on lessons" ON lessons FOR ALL USING (true) WITH CHECK (true);

-- 10. Define RLS Policies for User Progress
CREATE POLICY "Allow public full access on user_progress" ON user_progress FOR ALL USING (true) WITH CHECK (true);

-- 11. Trigger to create a profile automatically when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  -- Automatically assign the student role using the IAM system
  SELECT id INTO default_role_id FROM public.iam_roles WHERE urn = 'role:user:student';
  IF default_role_id IS NOT NULL THEN
    INSERT INTO public.iam_user_roles (user_id, role_id) VALUES (new.id, default_role_id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. Set up Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 13. Set up Storage
INSERT INTO storage.buckets (id, name)
VALUES ('avatars', 'avatars');

CREATE POLICY "Allow public full access on avatars"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'avatars' ) WITH CHECK ( bucket_id = 'avatars' );

-- Migration 00001_initial_schema.sql
-- Combined from dev/data.sql and supabase_schema.sql
-- Note: The `profiles` table definitions and RLS policies were logically merged

-- 1. Create custom types
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');

-- 2. Create Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  role user_role DEFAULT 'student'::user_role NOT NULL,
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
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 8. Define RLS Policies for Courses
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Instructors can view their own unpublished courses" ON courses FOR SELECT USING (auth.uid() = instructor_id);
CREATE POLICY "Instructors can insert courses" ON courses FOR INSERT WITH CHECK (
  auth.uid() = instructor_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor')
);
CREATE POLICY "Instructors can update own courses" ON courses FOR UPDATE USING (auth.uid() = instructor_id);
CREATE POLICY "Instructors can delete own courses" ON courses FOR DELETE USING (auth.uid() = instructor_id);

-- 9. Define RLS Policies for Lessons
CREATE POLICY "Anyone can view lessons of published courses" ON lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE id = lessons.course_id AND is_published = true)
);
CREATE POLICY "Instructors can manage lessons for their courses" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE id = lessons.course_id AND instructor_id = auth.uid())
);

-- 10. Define RLS Policies for User Progress
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- 11. Trigger to create a profile automatically when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'student');
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

CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );

CREATE POLICY "Anyone can update an avatar."
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'avatars' );

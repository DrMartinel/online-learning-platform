-- Migration 00005_chapters_and_lesson_media.sql
-- Creates the `chapters` and `lesson_media` tables for hierarchical course curriculum.

-- 1. Create public.chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view chapters of published courses" ON public.chapters;
DROP POLICY IF EXISTS "Instructors can manage chapters for their courses" ON public.chapters;
DROP POLICY IF EXISTS "Service role full access on chapters" ON public.chapters;

-- Cấu hình RLS cho chapters
CREATE POLICY "Anyone can view chapters of published courses" ON public.chapters 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = chapters.course_id AND is_published = true)
  );

CREATE POLICY "Instructors can manage chapters for their courses" ON public.chapters 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = chapters.course_id AND instructor_id = auth.uid())
  );

CREATE POLICY "Service role full access on chapters" ON public.chapters 
  FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);


-- 2. Alter public.lessons to link to chapters
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE;

-- Auto-migrate existing lessons by grouping them into a default chapter per course if they lack one
DO $$
DECLARE
  r RECORD;
  default_chapter_id UUID;
BEGIN
  FOR r IN SELECT DISTINCT course_id FROM public.lessons WHERE chapter_id IS NULL LOOP
    -- Create default chapter
    INSERT INTO public.chapters (course_id, title, order_index)
    VALUES (r.course_id, 'Chương 1: Giới thiệu & Khái quát', 0)
    RETURNING id INTO default_chapter_id;
    
    -- Assign lessons of this course to this default chapter
    UPDATE public.lessons 
    SET chapter_id = default_chapter_id 
    WHERE course_id = r.course_id AND chapter_id IS NULL;
  END LOOP;
END $$;


-- 3. Create public.lesson_media table
CREATE TABLE IF NOT EXISTS public.lesson_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'link')),
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lesson_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view media of published course lessons" ON public.lesson_media;
DROP POLICY IF EXISTS "Instructors can manage media of their lessons" ON public.lesson_media;
DROP POLICY IF EXISTS "Service role full access on lesson_media" ON public.lesson_media;

-- Cấu hình RLS cho lesson_media
CREATE POLICY "Anyone can view media of published course lessons" ON public.lesson_media 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.chapters c ON c.id = l.chapter_id
      JOIN public.courses co ON co.id = c.course_id
      WHERE l.id = lesson_media.lesson_id AND co.is_published = true
    )
  );

CREATE POLICY "Instructors can manage media of their lessons" ON public.lesson_media 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.chapters c ON c.id = l.chapter_id
      JOIN public.courses co ON co.id = c.course_id
      WHERE l.id = lesson_media.lesson_id AND co.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on lesson_media" ON public.lesson_media 
  FOR ALL TO service_role, postgres USING (true) WITH CHECK (true);

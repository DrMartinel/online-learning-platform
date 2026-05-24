-- Fix missing RLS policies on courses and lessons tables
-- These were previously failing to create because they referenced IAM tables before they were created.

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Instructors can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON public.lessons;
DROP POLICY IF EXISTS "Instructors can manage lessons for their courses" ON public.lessons;

-- Courses Policies
CREATE POLICY "Instructors can insert courses" ON public.courses FOR INSERT WITH CHECK (
  auth.uid() = instructor_id AND EXISTS (
    SELECT 1 FROM public.iam_user_roles iur
    JOIN public.iam_roles ir ON ir.id = iur.role_id
    WHERE iur.user_id = auth.uid() AND ir.urn IN ('role:user:operator', 'role:user:admin')
  )
);

CREATE POLICY "Instructors can update own courses" ON public.courses FOR UPDATE USING (
  auth.uid() = instructor_id AND EXISTS (
    SELECT 1 FROM public.iam_user_roles iur
    JOIN public.iam_roles ir ON ir.id = iur.role_id
    WHERE iur.user_id = auth.uid() AND ir.urn IN ('role:user:operator', 'role:user:admin')
  )
);

CREATE POLICY "Instructors can delete own courses" ON public.courses FOR DELETE USING (
  auth.uid() = instructor_id AND EXISTS (
    SELECT 1 FROM public.iam_user_roles iur
    JOIN public.iam_roles ir ON ir.id = iur.role_id
    WHERE iur.user_id = auth.uid() AND ir.urn IN ('role:user:operator', 'role:user:admin')
  )
);

-- Lessons Policies
CREATE POLICY "Anyone can view lessons of published courses" ON public.lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = lessons.course_id AND is_published = true)
);

CREATE POLICY "Instructors can manage lessons for their courses" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = lessons.course_id AND instructor_id = auth.uid())
);

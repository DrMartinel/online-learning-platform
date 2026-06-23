-- 00013_course_exams.sql

CREATE TABLE IF NOT EXISTS public.course_exams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- Row Level Security policies
ALTER TABLE public.course_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_exams_insert ON public.course_exams;
CREATE POLICY course_exams_insert ON public.course_exams
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT instructor_id FROM public.courses WHERE id = course_id));

DROP POLICY IF EXISTS course_exams_delete ON public.course_exams;
CREATE POLICY course_exams_delete ON public.course_exams
  FOR DELETE TO authenticated
  USING (auth.uid() = (SELECT instructor_id FROM public.courses WHERE id = course_id));

-- Students can select rows for courses they are enrolled in or public courses
DROP POLICY IF EXISTS course_exams_select ON public.course_exams;
CREATE POLICY course_exams_select ON public.course_exams
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments ce WHERE ce.course_id = course_id AND ce.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true
    )
  );

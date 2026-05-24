-- Migration 00004_course_media_bucket.sql
-- Creates the `course-media` bucket for course thumbnails and lesson videos

INSERT INTO storage.buckets (id, name, public)
VALUES ('course-media', 'course-media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Publicly accessible
CREATE POLICY "Course media is publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'course-media' );

-- Policy: Instructors can upload course media
CREATE POLICY "Instructors can upload course media"
  ON storage.objects FOR INSERT
  WITH CHECK ( 
    bucket_id = 'course-media' 
    AND EXISTS (
      SELECT 1 FROM public.iam_user_roles iur
      JOIN public.iam_role_permissions irp ON irp.role_id = iur.role_id
      JOIN public.iam_permissions ip ON ip.id = irp.permission_id
      WHERE iur.user_id = auth.uid() 
      AND (ip.urn = 'action:course:create' OR ip.urn = 'action:lesson:create')
    )
  );

-- Policy: Instructors can update course media
CREATE POLICY "Instructors can update course media"
  ON storage.objects FOR UPDATE
  USING ( 
    bucket_id = 'course-media' 
    AND EXISTS (
      SELECT 1 FROM public.iam_user_roles iur
      JOIN public.iam_role_permissions irp ON irp.role_id = iur.role_id
      JOIN public.iam_permissions ip ON ip.id = irp.permission_id
      WHERE iur.user_id = auth.uid() 
      AND (ip.urn = 'action:course:create' OR ip.urn = 'action:lesson:create')
    )
  );

-- Policy: Instructors can delete course media
CREATE POLICY "Instructors can delete course media"
  ON storage.objects FOR DELETE
  USING ( 
    bucket_id = 'course-media' 
    AND EXISTS (
      SELECT 1 FROM public.iam_user_roles iur
      JOIN public.iam_role_permissions irp ON irp.role_id = iur.role_id
      JOIN public.iam_permissions ip ON ip.id = irp.permission_id
      WHERE iur.user_id = auth.uid() 
      AND (ip.urn = 'action:course:create' OR ip.urn = 'action:lesson:create')
    )
  );

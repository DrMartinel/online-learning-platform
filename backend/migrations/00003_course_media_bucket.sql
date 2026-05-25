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
    AND auth.role() = 'authenticated'
  );

-- Policy: Instructors can update course media
CREATE POLICY "Instructors can update course media"
  ON storage.objects FOR UPDATE
  USING ( 
    bucket_id = 'course-media' 
    AND auth.role() = 'authenticated'
  );

-- Policy: Instructors can delete course media
CREATE POLICY "Instructors can delete course media"
  ON storage.objects FOR DELETE
  USING ( 
    bucket_id = 'course-media' 
    AND auth.role() = 'authenticated'
  );

-- Migration 00004_course_media_bucket.sql
-- Creates the `course-media` bucket for course thumbnails and lesson videos

INSERT INTO storage.buckets (id, name)
VALUES ('course-media', 'course-media')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated access on course-media"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'course-media' AND auth.role() = 'authenticated' )
  WITH CHECK ( bucket_id = 'course-media' AND auth.role() = 'authenticated' );

-- backend/migrations/00011_add_price_and_enrollment.sql

-- 1. Thêm cột price vào bảng courses
ALTER TABLE courses ADD COLUMN price BIGINT DEFAULT 0 NOT NULL;

-- 2. Tạo bảng enrollments để lưu quyền sở hữu khóa học
CREATE TABLE enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Mỗi user chỉ được sở hữu 1 khóa học 1 lần
  UNIQUE(user_id, course_id)
);

-- 3. Bật RLS và cấp quyền cho Backend thao tác (Giống cấu trúc các bảng khác)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on enrollments" ON enrollments FOR ALL USING (true) WITH CHECK (true);
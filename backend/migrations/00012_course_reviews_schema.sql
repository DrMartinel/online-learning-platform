-- backend/migrations/00012_course_reviews_schema.sql

-- 1. Tạo bảng course_reviews
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'hidden')),
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Mỗi học viên chỉ được đánh giá một khóa học duy nhất một lần
  CONSTRAINT unique_user_course_review UNIQUE(user_id, course_id)
);

-- 2. Bật RLS và cấp quyền cho Backend thao tác (Giống cấu trúc các bảng khác)
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public full access on course_reviews" ON public.course_reviews FOR ALL USING (true) WITH CHECK (true);

-- Migration 00008_exam_sessions.sql
-- Exam Sessions & Student Attempts Schema

-- 1. Create exam_sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL, -- Null means Public Exam
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  access_code TEXT, -- Access password if set
  status TEXT DEFAULT 'draft' NOT NULL, -- draft, active, finished
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  submit_time TIMESTAMP WITH TIME ZONE,
  answers JSONB DEFAULT '{}'::jsonb NOT NULL, -- JSON format: { "question_id": { "option_index": 0 } }
  score NUMERIC(5,2),
  status TEXT DEFAULT 'inprogress' NOT NULL, -- inprogress, submitted, graded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, session_id)
);

-- 3. Add Indexes
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_course_id ON exam_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_session_id ON exam_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON exam_attempts(user_id);

-- 4. Enable RLS
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Allow public full access since NestJS Backend controls authorization via IAM)
CREATE POLICY "Allow public full access on exam_sessions" ON exam_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on exam_attempts" ON exam_attempts FOR ALL USING (true) WITH CHECK (true);

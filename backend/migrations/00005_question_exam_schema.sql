-- Migration 00005_question_exam_schema.sql
-- Question Bank & Exam feature

-- 1. Create question type enum
DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('essay', 'single_choice', 'multiple_choice');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Questions table (global, not tied to a course)
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type question_type NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. Question variants table
-- Each question can have multiple variants (different forms of the same question)
-- content supports LaTeX (stored as raw string, rendered by frontend)
-- options: JSONB array for MCQ, e.g. [{"label":"A","text":"..."},{"label":"B","text":"..."}]
-- correct_answer: JSONB, e.g. {"index":0} for single_choice, {"indices":[0,2]} for multiple_choice, null for essay
CREATE TABLE IF NOT EXISTS question_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  variant_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(question_id, variant_index)
);

-- 4. Exams table (raw storage / documentation templates)
CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  header_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 5. Exam questions join table (ordered list of questions in an exam)
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  points NUMERIC(5,2) DEFAULT 1.0,
  UNIQUE(exam_id, question_id),
  UNIQUE(exam_id, order_index)
);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_question_variants_question_id ON question_variants(question_id);
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON exam_questions(question_id);

-- 7. Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies (permissive for now, backend handles authorization via IAM)
CREATE POLICY "Allow public full access on questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on question_variants" ON question_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on exams" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on exam_questions" ON exam_questions FOR ALL USING (true) WITH CHECK (true);

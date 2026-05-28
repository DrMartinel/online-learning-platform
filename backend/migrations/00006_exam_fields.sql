-- Migration 00006_exam_fields.sql
-- Add additional fields to exams table for advanced features

ALTER TABLE exams ADD COLUMN IF NOT EXISTS question_label TEXT DEFAULT 'Câu';
ALTER TABLE exams ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS access_rights TEXT DEFAULT 'private';

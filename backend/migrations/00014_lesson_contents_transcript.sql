-- Migration 00014_lesson_contents_transcript.sql
-- Add transcript column to lesson_contents to cache video transcripts

ALTER TABLE lesson_contents ADD COLUMN IF NOT EXISTS transcript TEXT;

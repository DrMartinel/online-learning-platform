-- Migration 00007_question_serial.sql
-- Add global sequential integer ID starting at 16200 for questions

CREATE SEQUENCE IF NOT EXISTS question_serial_seq START 16200;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS serial_number INTEGER DEFAULT nextval('question_serial_seq') UNIQUE;

-- Migration 00009_rag_knowledge_base.sql
-- Allow document_chunks to store non-course-specific content (knowledge base entries)
-- by making course_id nullable and adding support for 'knowledge_base' source type.

-- 1. Drop the existing NOT NULL + foreign key constraint on course_id
--    to allow knowledge base chunks that aren't tied to any course.
ALTER TABLE document_chunks ALTER COLUMN course_id DROP NOT NULL;

-- 2. Update the match_documents function to also search knowledge base entries
--    when no course filter is provided. When courseId IS NULL, search everything.
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(768),
    match_count INT DEFAULT 5,
    filter_course_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    course_id UUID,
    lesson_id UUID,
    content TEXT,
    source_type TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.course_id,
        dc.lesson_id,
        dc.content,
        dc.source_type,
        dc.metadata,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE (filter_course_id IS NULL OR dc.course_id = filter_course_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Migration 00005_rag_vector_schema.sql
-- Enable pgvector for RAG (Retrieval-Augmented Generation) system
-- Uses Gemini embedding-001 at 768 dimensions

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add transcript column to lessons for video transcripts
-- Can be manually provided by instructors or auto-generated via Gemini
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS transcript TEXT;

-- 3. Document chunks table for RAG
CREATE TABLE document_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL DEFAULT 'text',  -- 'text' | 'video_transcript'
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',  -- { timestamp_start, timestamp_end, lesson_title, ... }
    embedding VECTOR(768),  -- Gemini embedding-001 at 768 dims (MRL)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HNSW index for fast cosine similarity search
CREATE INDEX idx_document_chunks_embedding
    ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 5. Standard indexes
CREATE INDEX idx_document_chunks_course ON document_chunks(course_id);
CREATE INDEX idx_document_chunks_lesson ON document_chunks(lesson_id);
CREATE INDEX idx_document_chunks_source_type ON document_chunks(source_type);

-- 6. Enable RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Anyone can read chunks from published courses (for RAG queries)
CREATE POLICY "Anyone can read chunks of published courses"
    ON document_chunks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM courses WHERE id = document_chunks.course_id AND is_published = true
    ));

-- Only service_role can insert/update/delete (backend manages embeddings)
-- (No user-facing write policies needed — backend uses SERVICE_ROLE_KEY)

-- 7. Similarity search function
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
    JOIN courses c ON c.id = dc.course_id
    WHERE c.is_published = true
      AND (filter_course_id IS NULL OR dc.course_id = filter_course_id)
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

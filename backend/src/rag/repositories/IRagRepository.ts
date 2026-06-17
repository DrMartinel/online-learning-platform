import { DocumentChunk, MatchResult } from '../entities/DocumentChunk';

export interface IRagRepository {
  /**
   * Insert or update document chunks (deletes existing chunks for the same lesson/source_type first).
   */
  upsertChunks(chunks: DocumentChunk[]): Promise<void>;

  /**
   * Insert or update knowledge base chunks (deletes existing chunks with the same title first).
   */
  upsertKnowledgeBaseChunks(chunks: DocumentChunk[], title: string): Promise<void>;

  /**
   * Delete all knowledge base chunks with a specific title.
   */
  deleteKnowledgeBaseChunks(title: string): Promise<void>;

  /**
   * Delete all chunks for a specific lesson.
   */
  deleteChunksByLesson(lessonId: string): Promise<void>;

  /**
   * Delete all chunks for a specific course.
   */
  deleteChunksByCourse(courseId: string): Promise<void>;

  /**
   * Perform similarity search using the match_documents Postgres function.
   */
  matchDocuments(
    embedding: number[],
    matchCount: number,
    courseId?: string,
  ): Promise<MatchResult[]>;

  /**
   * Get ingestion status for a course (chunk counts by type).
   */
  getIngestionStatus(courseId: string): Promise<{
    totalChunks: number;
    textChunks: number;
    videoTranscriptChunks: number;
    lastUpdated: string | null;
  }>;

  /**
   * Save a transcript to the lessons table.
   */
  saveTranscript(lessonId: string, transcript: string): Promise<void>;

  /**
   * Get the transcript for a lesson (returns null if not set).
   */
  getTranscript(lessonId: string): Promise<string | null>;
}

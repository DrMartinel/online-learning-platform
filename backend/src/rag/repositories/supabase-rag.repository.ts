import { SupabaseClient } from '@supabase/supabase-js';
import { IRagRepository } from './IRagRepository';
import { DocumentChunk, MatchResult } from '../entities/DocumentChunk';

export class SupabaseRagRepository implements IRagRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async upsertChunks(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    // Group by lessonId + sourceType so we can delete old chunks before inserting
    const groups = new Map<string, DocumentChunk[]>();
    for (const chunk of chunks) {
      const key = `${chunk.lessonId ?? 'course'}_${chunk.sourceType}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(chunk);
    }

    for (const [, groupChunks] of groups) {
      const first = groupChunks[0];

      // Delete existing chunks for this lesson + source_type
      if (first.lessonId) {
        const { error: deleteError } = await this.supabase
          .from('document_chunks')
          .delete()
          .eq('lesson_id', first.lessonId)
          .eq('source_type', first.sourceType);

        if (deleteError) {
          throw new Error(`Failed to delete old chunks: ${deleteError.message}`);
        }
      }

      // Insert new chunks
      const rows = groupChunks.map((chunk) => ({
        id: chunk.id,
        course_id: chunk.courseId,
        lesson_id: chunk.lessonId,
        source_type: chunk.sourceType,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        metadata: chunk.metadata,
        embedding: chunk.embedding
          ? `[${chunk.embedding.join(',')}]`
          : null,
      }));

      const { error: insertError } = await this.supabase
        .from('document_chunks')
        .insert(rows);

      if (insertError) {
        throw new Error(`Failed to insert chunks: ${insertError.message}`);
      }
    }
  }

  async upsertKnowledgeBaseChunks(chunks: DocumentChunk[], title: string): Promise<void> {
    if (chunks.length === 0) return;

    // Delete existing knowledge base chunks with this title
    await this.deleteKnowledgeBaseChunks(title);

    // Insert new chunks
    const rows = chunks.map((chunk) => ({
      id: chunk.id,
      course_id: chunk.courseId,
      lesson_id: chunk.lessonId,
      source_type: chunk.sourceType,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: chunk.embedding
        ? `[${chunk.embedding.join(',')}]`
        : null,
    }));

    const { error: insertError } = await this.supabase
      .from('document_chunks')
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert knowledge base chunks: ${insertError.message}`);
    }
  }

  async deleteKnowledgeBaseChunks(title: string): Promise<void> {
    const { error } = await this.supabase
      .from('document_chunks')
      .delete()
      .eq('source_type', 'knowledge_base')
      .contains('metadata', { title });

    if (error) {
      throw new Error(`Failed to delete knowledge base chunks for "${title}": ${error.message}`);
    }
  }

  async deleteChunksByLesson(lessonId: string): Promise<void> {
    const { error } = await this.supabase
      .from('document_chunks')
      .delete()
      .eq('lesson_id', lessonId);

    if (error) {
      throw new Error(`Failed to delete chunks for lesson ${lessonId}: ${error.message}`);
    }
  }

  async deleteChunksByCourse(courseId: string): Promise<void> {
    const { error } = await this.supabase
      .from('document_chunks')
      .delete()
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to delete chunks for course ${courseId}: ${error.message}`);
    }
  }

  async matchDocuments(
    embedding: number[],
    matchCount: number,
    courseId?: string,
  ): Promise<MatchResult[]> {
    const { data, error } = await this.supabase.rpc('match_documents', {
      query_embedding: `[${embedding.join(',')}]`,
      match_count: matchCount,
      filter_course_id: courseId ?? null,
    });

    if (error) {
      throw new Error(`Similarity search failed: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      courseId: row.course_id,
      lessonId: row.lesson_id,
      content: row.content,
      sourceType: row.source_type,
      metadata: row.metadata,
      similarity: row.similarity,
    }));
  }

  async getIngestionStatus(courseId: string): Promise<{
    totalChunks: number;
    textChunks: number;
    videoTranscriptChunks: number;
    lastUpdated: string | null;
  }> {
    const { data, error } = await this.supabase
      .from('document_chunks')
      .select('source_type, created_at')
      .eq('course_id', courseId);

    if (error) {
      throw new Error(`Failed to get ingestion status: ${error.message}`);
    }

    const rows = data || [];
    const textChunks = rows.filter((r: any) => r.source_type === 'text').length;
    const videoTranscriptChunks = rows.filter(
      (r: any) => r.source_type === 'video_transcript',
    ).length;

    let lastUpdated: string | null = null;
    if (rows.length > 0) {
      lastUpdated = rows.reduce((latest: string, r: any) =>
        r.created_at > latest ? r.created_at : latest,
        rows[0].created_at,
      );
    }

    return {
      totalChunks: rows.length,
      textChunks,
      videoTranscriptChunks,
      lastUpdated,
    };
  }

  async saveTranscript(lessonId: string, transcript: string): Promise<void> {
    const { error } = await this.supabase
      .from('lessons')
      .update({ transcript })
      .eq('id', lessonId);

    if (error) {
      throw new Error(`Failed to save transcript: ${error.message}`);
    }
  }

  async getTranscript(lessonId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('lessons')
      .select('transcript')
      .eq('id', lessonId)
      .single();

    if (error) {
      throw new Error(`Failed to get transcript: ${error.message}`);
    }

    return data?.transcript ?? null;
  }
}

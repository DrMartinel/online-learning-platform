import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IRagRepository } from '../repositories/IRagRepository';
import { EmbeddingService } from './embedding.service';
import { TranscriptionService } from './transcription.service';
import { LlmService } from './llm.service';
import { DocumentChunk } from '../entities/DocumentChunk';
import { RAGResponse, IngestStatus } from '../dto/rag.dto';
import { randomUUID } from 'crypto';

/** Minimum similarity score to consider a match relevant */
const SIMILARITY_THRESHOLD = 0.35;

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    @Inject('IRagRepository')
    private readonly ragRepo: IRagRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly transcriptionService: TranscriptionService,
    private readonly llmService: LlmService,
    private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Query the RAG system: embed the question, search for relevant chunks,
   * and generate an answer using the LLM.
   *
   * When courseId is provided, searches within that course's content.
   * When courseId is omitted, searches across ALL content including knowledge base entries.
   * Falls back to general LLM knowledge when no sufficiently relevant context is found.
   */
  async query(
    question: string,
    courseId?: string,
    maxResults: number = 5,
  ): Promise<RAGResponse> {
    this.logger.log(`RAG query: "${question.substring(0, 50)}..." courseId=${courseId || 'all'}`);

    // Step 1: Generate embedding for the question
    const queryEmbedding = await this.embeddingService.generateEmbedding(question);

    // Step 2: Similarity search (scoped to course if provided, otherwise global)
    const matches = await this.ragRepo.matchDocuments(
      queryEmbedding,
      maxResults,
      courseId,
    );

    // Step 3: Filter out low-similarity matches
    const relevantMatches = matches.filter(
      (match) => match.similarity >= SIMILARITY_THRESHOLD,
    );

    // Step 4: Generate answer
    let answer: string;
    let usedGeneralKnowledge = false;

    if (relevantMatches.length === 0) {
      // No relevant context found — fall back to general LLM knowledge
      this.logger.log('No relevant context found, falling back to general knowledge');
      answer = await this.llmService.generateGeneralAnswer(question);
      usedGeneralKnowledge = true;
    } else {
      // Build context from relevant matches
      const contextChunks = relevantMatches.map((match) => ({
        content: match.content,
        sourceType: match.sourceType,
        metadata: match.metadata,
      }));

      answer = await this.llmService.generateAnswer(question, contextChunks);
    }

    // Step 5: Build response with sources (only include relevant matches)
    const sources = relevantMatches.map((match) => ({
      lessonId: match.lessonId,
      courseId: match.courseId,
      content: match.content.substring(0, 200) + (match.content.length > 200 ? '...' : ''),
      sourceType: match.sourceType as 'text' | 'video_transcript' | 'knowledge_base',
      similarity: match.similarity,
      timestamp: match.metadata?.timestamp_start || undefined,
    }));

    return { answer, sources, usedGeneralKnowledge };
  }

  /**
   * Ingest arbitrary knowledge base content (project docs, FAQs, platform info, etc.).
   * This content is NOT tied to any specific course or lesson and is searchable globally.
   */
  async ingestKnowledgeBase(
    title: string,
    content: string,
    category: string = 'general',
  ): Promise<void> {
    this.logger.log(`Ingesting knowledge base entry: "${title}" [${category}]`);

    const fullText = `${title}\n\n${content}`;
    const chunks = this.embeddingService.chunkText(fullText);
    if (chunks.length === 0) return;

    this.logger.log(`Embedding ${chunks.length} knowledge base chunks for "${title}"`);

    const embeddings = await this.embeddingService.generateEmbeddings(chunks);

    const documentChunks: DocumentChunk[] = chunks.map((chunkContent, index) => ({
      id: randomUUID(),
      courseId: null as any, // Knowledge base entries are not tied to a specific course
      lessonId: null,
      sourceType: 'knowledge_base' as const,
      chunkIndex: index,
      content: chunkContent,
      metadata: {
        source: 'knowledge_base',
        title,
        category,
        chunk_index: index,
        total_chunks: chunks.length,
      },
      embedding: embeddings[index],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await this.ragRepo.upsertKnowledgeBaseChunks(documentChunks, title);
  }

  /**
   * Ingest all lessons of a course: chunk content, generate embeddings,
   * transcribe videos, and store everything.
   */
  async ingestCourse(courseId: string): Promise<void> {
    this.logger.log(`Starting ingestion for course: ${courseId}`);

    // Fetch all lessons for the course
    const { data: lessons, error } = await this.supabase
      .from('lessons')
      .select('id, title, content, video_url, transcript')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch lessons for course ${courseId}: ${error.message}`);
    }

    if (!lessons || lessons.length === 0) {
      this.logger.warn(`No lessons found for course ${courseId}`);
      return;
    }

    // Also fetch course description for embedding
    const { data: course, error: courseError } = await this.supabase
      .from('courses')
      .select('title, description')
      .eq('id', courseId)
      .single();

    if (courseError) {
      throw new Error(`Failed to fetch course ${courseId}: ${courseError.message}`);
    }

    // Ingest course description if available
    if (course?.description) {
      await this.ingestText(
        courseId,
        null,
        `Course: ${course.title}\n\n${course.description}`,
        { source: 'course_description', course_title: course.title },
      );
    }

    // Ingest each lesson
    for (const lesson of lessons) {
      await this.ingestLessonContent(courseId, lesson);
    }

    this.logger.log(`Ingestion complete for course: ${courseId}`);
  }

  /**
   * Ingest a single lesson's content and video transcript.
   */
  async ingestLesson(lessonId: string): Promise<void> {
    this.logger.log(`Starting ingestion for lesson: ${lessonId}`);

    const { data: lesson, error } = await this.supabase
      .from('lessons')
      .select('id, course_id, title, content, video_url, transcript')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      throw new Error(`Failed to fetch lesson ${lessonId}: ${error?.message || 'Not found'}`);
    }

    await this.ingestLessonContent(lesson.course_id, lesson);

    this.logger.log(`Ingestion complete for lesson: ${lessonId}`);
  }

  /**
   * Force re-transcription of a lesson's video.
   */
  async transcribeLesson(lessonId: string): Promise<void> {
    const { data: lesson, error } = await this.supabase
      .from('lessons')
      .select('id, course_id, title, video_url')
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      throw new Error(`Failed to fetch lesson ${lessonId}: ${error?.message || 'Not found'}`);
    }

    if (!lesson.video_url) {
      throw new Error(`Lesson ${lessonId} has no video URL`);
    }

    // Transcribe and save
    const transcription = await this.transcriptionService.transcribeVideo(lesson.video_url);
    await this.ragRepo.saveTranscript(lessonId, transcription.fullText);

    // Re-ingest the video transcript chunks
    await this.ingestVideoTranscript(
      lesson.course_id,
      lessonId,
      transcription,
      lesson.title,
    );
  }

  /**
   * Get the ingestion status for a course.
   */
  async getIngestionStatus(courseId: string): Promise<IngestStatus> {
    const status = await this.ragRepo.getIngestionStatus(courseId);
    return {
      courseId,
      ...status,
    };
  }

  // --- Private helpers ---

  private async ingestLessonContent(
    courseId: string,
    lesson: {
      id: string;
      title: string;
      content: string | null;
      video_url: string | null;
      transcript: string | null;
    },
  ): Promise<void> {
    // 1. Ingest text content
    if (lesson.content) {
      await this.ingestText(
        courseId,
        lesson.id,
        `Lesson: ${lesson.title}\n\n${lesson.content}`,
        { source: 'lesson_content', lesson_title: lesson.title },
      );
    }

    // 2. Ingest video transcript
    if (lesson.video_url) {
      let transcript = lesson.transcript;

      // Auto-transcribe if no cached transcript exists
      if (!transcript) {
        try {
          const result = await this.transcriptionService.transcribeVideo(lesson.video_url);
          transcript = result.fullText;

          // Cache the transcript
          await this.ragRepo.saveTranscript(lesson.id, transcript);

          // Use the segmented transcript for better timestamps
          await this.ingestVideoTranscript(courseId, lesson.id, result, lesson.title);
          return; // Already ingested via segments
        } catch (error) {
          this.logger.error(
            `Failed to transcribe video for lesson ${lesson.id}: ${error}`,
          );
          // Continue without video transcript
          return;
        }
      }

      // Ingest from cached (non-segmented) transcript
      await this.ingestText(
        courseId,
        lesson.id,
        `Video Transcript - Lesson: ${lesson.title}\n\n${transcript}`,
        { source: 'video_transcript', lesson_title: lesson.title },
        'video_transcript',
      );
    }
  }

  private async ingestText(
    courseId: string,
    lessonId: string | null,
    text: string,
    metadata: Record<string, any>,
    sourceType: 'text' | 'video_transcript' = 'text',
  ): Promise<void> {
    const chunks = this.embeddingService.chunkText(text);
    if (chunks.length === 0) return;

    this.logger.log(
      `Embedding ${chunks.length} ${sourceType} chunks for lesson ${lessonId || 'course-level'}`,
    );

    const embeddings = await this.embeddingService.generateEmbeddings(chunks);

    const documentChunks: DocumentChunk[] = chunks.map((content, index) => ({
      id: randomUUID(),
      courseId,
      lessonId,
      sourceType,
      chunkIndex: index,
      content,
      metadata: { ...metadata, chunk_index: index, total_chunks: chunks.length },
      embedding: embeddings[index],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await this.ragRepo.upsertChunks(documentChunks);
  }

  private async ingestVideoTranscript(
    courseId: string,
    lessonId: string,
    transcription: { fullText: string; segments: Array<{ text: string; timestampStart: string; timestampEnd: string }> },
    lessonTitle: string,
  ): Promise<void> {
    // If we have segments, embed each segment individually for better timestamp referencing
    if (transcription.segments.length > 0) {
      const texts = transcription.segments.map(
        (seg) => `[${seg.timestampStart}] ${seg.text}`,
      );

      // Some segments may be very small — combine short adjacent segments
      const combinedTexts: string[] = [];
      const combinedMetadata: Array<{ timestamp_start: string; timestamp_end: string }> = [];
      let buffer = '';
      let bufferStart = transcription.segments[0]?.timestampStart || '00:00';
      let bufferEnd = transcription.segments[0]?.timestampEnd || '00:00';

      for (let i = 0; i < texts.length; i++) {
        buffer += (buffer ? ' ' : '') + texts[i];
        bufferEnd = transcription.segments[i].timestampEnd;

        if (buffer.length >= 300 || i === texts.length - 1) {
          combinedTexts.push(buffer);
          combinedMetadata.push({
            timestamp_start: bufferStart,
            timestamp_end: bufferEnd,
          });
          buffer = '';
          if (i + 1 < texts.length) {
            bufferStart = transcription.segments[i + 1].timestampStart;
          }
        }
      }

      this.logger.log(
        `Embedding ${combinedTexts.length} video transcript segments for lesson ${lessonId}`,
      );

      const embeddings = await this.embeddingService.generateEmbeddings(combinedTexts);

      const documentChunks: DocumentChunk[] = combinedTexts.map((content, index) => ({
        id: randomUUID(),
        courseId,
        lessonId,
        sourceType: 'video_transcript' as const,
        chunkIndex: index,
        content,
        metadata: {
          source: 'video_transcript',
          lesson_title: lessonTitle,
          ...combinedMetadata[index],
          chunk_index: index,
          total_chunks: combinedTexts.length,
        },
        embedding: embeddings[index],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await this.ragRepo.upsertChunks(documentChunks);
    } else {
      // Fallback: chunk the full transcript text
      await this.ingestText(
        courseId,
        lessonId,
        `Video Transcript - Lesson: ${lessonTitle}\n\n${transcription.fullText}`,
        { source: 'video_transcript', lesson_title: lessonTitle },
        'video_transcript',
      );
    }
  }
}

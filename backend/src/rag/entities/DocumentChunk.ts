export interface DocumentChunk {
  id: string;
  courseId: string;
  lessonId: string | null;
  sourceType: 'text' | 'video_transcript';
  chunkIndex: number;
  content: string;
  metadata: Record<string, any>;
  embedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchResult {
  id: string;
  courseId: string;
  lessonId: string | null;
  content: string;
  sourceType: 'text' | 'video_transcript';
  metadata: Record<string, any>;
  similarity: number;
}

export interface TranscriptionSegment {
  text: string;
  timestampStart: string; // e.g. "00:03:42"
  timestampEnd: string;   // e.g. "00:04:15"
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptionSegment[];
}

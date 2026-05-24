import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly ai: GoogleGenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for the RAG module');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.model = this.configService.get<string>('RAG_LLM_MODEL') || 'gemini-2.5-flash';
  }

  /**
   * Generate an answer to a question using the provided context chunks.
   * The LLM is instructed to only answer based on the given context.
   */
  async generateAnswer(
    question: string,
    contextChunks: Array<{
      content: string;
      sourceType: string;
      metadata: Record<string, any>;
    }>,
  ): Promise<string> {
    if (contextChunks.length === 0) {
      return "I don't have enough information from the course materials to answer that question. Please try rephrasing or ask about a different topic covered in the course.";
    }

    const contextText = contextChunks
      .map((chunk, i) => {
        const sourceLabel =
          chunk.sourceType === 'video_transcript'
            ? `[Video Transcript${chunk.metadata?.timestamp_start ? ` at ${chunk.metadata.timestamp_start}` : ''}]`
            : '[Lesson Text]';
        return `Context ${i + 1} ${sourceLabel}:\n${chunk.content}`;
      })
      .join('\n\n---\n\n');

    const systemPrompt = `You are a helpful teaching assistant for an online learning platform. Your role is to answer student questions based ONLY on the provided course material context.

Rules:
- Answer the question using ONLY the information from the provided context
- If the context does not contain enough information to answer the question, say so clearly
- Be concise but thorough in your explanations
- When referencing information from video transcripts, mention the approximate timestamp if available
- Use a friendly, educational tone
- Format your response with markdown for readability when appropriate
- Do NOT make up information or use knowledge outside the provided context`;

    const result = await this.ai.models.generateContent({
      model: this.model,
      contents: `${systemPrompt}\n\n--- COURSE MATERIAL CONTEXT ---\n\n${contextText}\n\n--- STUDENT QUESTION ---\n\n${question}`,
    });

    const answer = result.text;
    if (!answer) {
      return 'I was unable to generate an answer. Please try again.';
    }

    return answer;
  }
}

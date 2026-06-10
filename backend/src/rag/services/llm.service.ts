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
   * Supports both course-specific RAG and general knowledge base queries.
   */
  async generateAnswer(
    question: string,
    contextChunks: Array<{
      content: string;
      sourceType: string;
      metadata: Record<string, any>;
    }>,
    options?: {
      isGeneralQuery?: boolean;
    },
  ): Promise<string> {
    // If no context and not a general query, fall back to general knowledge
    if (contextChunks.length === 0 && !options?.isGeneralQuery) {
      return this.generateGeneralAnswer(question);
    }

    if (contextChunks.length === 0 && options?.isGeneralQuery) {
      return this.generateGeneralAnswer(question);
    }

    const hasKnowledgeBase = contextChunks.some(c => c.sourceType === 'knowledge_base');
    const hasCourseContent = contextChunks.some(c => c.sourceType !== 'knowledge_base');

    const contextText = contextChunks
      .map((chunk, i) => {
        let sourceLabel: string;
        if (chunk.sourceType === 'video_transcript') {
          sourceLabel = `[Video Transcript${chunk.metadata?.timestamp_start ? ` at ${chunk.metadata.timestamp_start}` : ''}]`;
        } else if (chunk.sourceType === 'knowledge_base') {
          sourceLabel = `[Knowledge Base - ${chunk.metadata?.category || 'General'}]`;
        } else {
          sourceLabel = '[Lesson Text]';
        }
        return `Context ${i + 1} ${sourceLabel}:\n${chunk.content}`;
      })
      .join('\n\n---\n\n');

    let systemPrompt: string;

    if (hasCourseContent && !hasKnowledgeBase) {
      // Pure course-specific query
      systemPrompt = `You are a helpful teaching assistant for an online learning platform. Your role is to answer student questions based ONLY on the provided course material context.

Rules:
- Answer the question using ONLY the information from the provided context
- If the context does not contain enough information to answer the question, say so clearly
- Be concise but thorough in your explanations
- When referencing information from video transcripts, mention the approximate timestamp if available
- Use a friendly, educational tone
- Format your response with markdown for readability when appropriate
- Do NOT make up information or use knowledge outside the provided context`;
    } else if (hasKnowledgeBase && !hasCourseContent) {
      // Pure knowledge base query (platform info, project info, etc.)
      systemPrompt = `You are an AI assistant for an online learning platform. You have access to the platform's knowledge base which contains information about the project, features, and general topics.

Rules:
- Answer the question using the information from the provided knowledge base context
- You may supplement with your general knowledge if the context provides a strong foundation
- Be concise but thorough in your explanations
- Use a friendly, helpful tone
- Format your response with markdown for readability when appropriate
- If the context doesn't cover the question well, let the user know what you found and suggest they ask in a different way`;
    } else {
      // Mixed: both course content and knowledge base
      systemPrompt = `You are a helpful AI assistant for an online learning platform. You have access to both course materials and the platform's general knowledge base.

Rules:
- Prioritize information from the provided context when answering
- Clearly distinguish between information from course materials and general knowledge base when relevant
- Be concise but thorough in your explanations
- When referencing information from video transcripts, mention the approximate timestamp if available
- Use a friendly, educational tone
- Format your response with markdown for readability when appropriate`;
    }

    const result = await this.ai.models.generateContent({
      model: this.model,
      contents: `${systemPrompt}\n\n--- CONTEXT ---\n\n${contextText}\n\n--- QUESTION ---\n\n${question}`,
    });

    const answer = result.text;
    if (!answer) {
      return 'I was unable to generate an answer. Please try again.';
    }

    return answer;
  }

  /**
   * Generate an answer using the LLM's general knowledge when no relevant
   * RAG context is available. Used as a fallback for out-of-scope questions.
   */
  async generateGeneralAnswer(question: string): Promise<string> {
    const systemPrompt = `You are a helpful AI assistant for an online learning platform. The user has asked a question that doesn't match any specific course material or knowledge base content.

Rules:
- You may answer general questions using your own knowledge
- Be helpful, concise, and accurate
- If the question seems to be about a specific course topic, suggest that the course content may need to be ingested first
- Use a friendly, educational tone
- Format your response with markdown for readability when appropriate
- Start your response by briefly noting that this answer is from general knowledge, not from course-specific materials`;

    const result = await this.ai.models.generateContent({
      model: this.model,
      contents: `${systemPrompt}\n\n--- QUESTION ---\n\n${question}`,
    });

    const answer = result.text;
    if (!answer) {
      return 'I was unable to generate an answer. Please try again.';
    }

    return answer;
  }
}

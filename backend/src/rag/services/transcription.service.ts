import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { SupabaseClient } from '@supabase/supabase-js';
import { TranscriptionResult, TranscriptionSegment } from '../entities/DocumentChunk';

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private readonly ai: GoogleGenAI;
  private readonly llmModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseClient: SupabaseClient
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for the RAG module');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.llmModel = this.configService.get<string>('RAG_LLM_MODEL') || 'gemini-2.5-flash';
  }

  /**
   * Transcribe a video by downloading it and processing with Gemini.
   * Uses the Gemini Files API for uploading and the LLM for transcription.
   */
  async transcribeVideo(videoUrl: string): Promise<TranscriptionResult> {
    this.logger.log(`Starting transcription for video: ${videoUrl}`);

    try {
      // Step 1: Download the video securely via Supabase Storage
      const { data, error } = await this.supabaseClient.storage
        .from('course-media')
        .download(videoUrl);

      if (error || !data) {
        throw new Error(`Failed to download video from storage: ${error?.message}`);
      }

      const videoBuffer = Buffer.from(await data.arrayBuffer());
      const contentType = data.type || 'video/mp4';

      this.logger.log(`Downloaded video: ${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB`);

      // Step 2: Upload to Gemini Files API
      const uploadedFile = await this.ai.files.upload({
        file: new Blob([videoBuffer], { type: contentType }),
        config: {
          mimeType: contentType,
        },
      });

      this.logger.log(`Uploaded to Gemini Files API: ${uploadedFile.name}`);

      // Step 3: Wait for file processing
      let file = uploadedFile;
      while (file.state === 'PROCESSING') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await this.ai.files.get({ name: file.name! });
      }

      if (file.state === 'FAILED') {
        throw new Error('Gemini failed to process the video file');
      }

      // Step 4: Transcribe using Gemini LLM
      const result = await this.ai.models.generateContent({
        model: this.llmModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                fileData: {
                  fileUri: file.uri!,
                  mimeType: contentType,
                },
              },
              {
                text: `Transcribe this video's audio content. Return a JSON object with this exact structure:
{
  "segments": [
    {
      "text": "The transcribed text for this segment",
      "timestampStart": "MM:SS",
      "timestampEnd": "MM:SS"
    }
  ]
}

Rules:
- Break the transcript into logical segments of 30-60 seconds each
- Use MM:SS format for timestamps (e.g. "03:42")
- Include ALL spoken content accurately
- If there is no audio or speech, return {"segments": []}
- Return ONLY the JSON object, no other text`,
              },
            ],
          },
        ],
      });

      const responseText = result.text || '';

      // Step 5: Parse the response
      const parsed = this.parseTranscriptionResponse(responseText);

      // Step 6: Clean up the uploaded file
      try {
        await this.ai.files.delete({ name: file.name! });
      } catch {
        this.logger.warn(`Failed to clean up file ${file.name}, it will expire automatically`);
      }

      this.logger.log(
        `Transcription complete: ${parsed.segments.length} segments, ${parsed.fullText.length} chars`,
      );

      return parsed;
    } catch (error) {
      this.logger.error(`Transcription failed for ${videoUrl}: ${error}`);
      throw error;
    }
  }

  /**
   * Parse the JSON response from Gemini into a TranscriptionResult.
   */
  private parseTranscriptionResponse(responseText: string): TranscriptionResult {
    try {
      // Extract JSON from response (may be wrapped in markdown code block)
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      const segments: TranscriptionSegment[] = (parsed.segments || []).map(
        (seg: any) => ({
          text: String(seg.text || ''),
          timestampStart: String(seg.timestampStart || '00:00'),
          timestampEnd: String(seg.timestampEnd || '00:00'),
        }),
      );

      const fullText = segments.map((s) => s.text).join(' ');

      return { fullText, segments };
    } catch {
      // If parsing fails, treat the entire response as plain text
      this.logger.warn('Failed to parse structured transcription, using raw text');
      return {
        fullText: responseText,
        segments: [
          {
            text: responseText,
            timestampStart: '00:00',
            timestampEnd: '00:00',
          },
        ],
      };
    }
  }
}

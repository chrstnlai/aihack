// veoClient.ts

import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";

export interface IVeoClient {
  /**
   * Generates a video from a transcript (string or JSON).
   * @param transcript - Raw transcript as string or JSON.
   * @param options - Optional config overrides.
   * @returns Promise resolving to video URLs.
   */
  generateVideo(
    transcript: string | object,
    options?: {
      aspectRatio?: "16:9" | "9:16";
      personGeneration?: "dont_allow" | "allow_adult" | "allow_all";
      numberOfVideos?: 1 | 2;
      negativePrompt?: string;
    }
  ): Promise<string[]>;
}

class VeoClient implements IVeoClient {
  private static _instance: VeoClient;
  private ai: GoogleGenAI;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
  }

  public static get instance(): VeoClient {
    if (!VeoClient._instance) {
      VeoClient._instance = new VeoClient();
    }
    return VeoClient._instance;
  }

  async generateVideo(
    transcript: string | object,
    options: {
      aspectRatio?: "16:9" | "9:16";
      personGeneration?: "dont_allow" | "allow_adult" | "allow_all";
      numberOfVideos?: 1 | 2;
      negativePrompt?: string;
    } = {}
  ): Promise<string[]> {
    // Convert transcript to string if JSON
    const prompt =
      typeof transcript === "string"
        ? transcript
        : JSON.stringify(transcript);

    const config: any = {
      aspectRatio: options.aspectRatio || "16:9",
      personGeneration: options.personGeneration || "dont_allow",
      numberOfVideos: options.numberOfVideos || 1,
      negativePrompt: options.negativePrompt,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" },
      ],
    };


    // Remove undefined values
    Object.keys(config).forEach(
      (k) => config[k] === undefined && delete config[k]
    );

    console.log('🎬 Veo Client - Starting video generation');
    console.log('🎬 Veo Client - Prompt:', prompt.substring(0, 100) + '...');
    console.log('🎬 Veo Client - Config:', config);

    let operation: GenerateVideosOperation = await this.ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt,
      config,
    });

    console.log('🎬 Veo Client - Initial operation:', {
      name: operation.name,
      done: operation.done,
      error: operation.error,
      metadata: operation.metadata
    });

    // Poll until done (10s interval)
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      console.log(`🎬 Veo Client - Polling ${pollCount}, operation status:`, {
        done: operation.done,
        error: operation.error,
        metadata: operation.metadata
      });
      
      await new Promise((r) => setTimeout(r, 10000));
      operation = await this.ai.operations.getVideosOperation({
        operation,
      });
    }

    console.log('🎬 Veo Client - Final operation result:', {
      done: operation.done,
      error: operation.error,
      metadata: operation.metadata,
      response: operation.response
    });

    // Return video URLs
    const videoUrls: string[] = [];
    if (operation.response?.generatedVideos) {
      console.log('🎬 Veo Client - Generated videos found:', operation.response.generatedVideos.length);
      const { generatedVideos } = operation.response;
      for (let n = 0; n < generatedVideos.length; n++) {
        const video = generatedVideos[n];
        console.log(`🎬 Veo Client - Video ${n}:`, video);
        if (video.video?.uri) {
          // Add API key to the URL for access
          const videoUrl = `${video.video.uri}&key=${process.env.GOOGLE_API_KEY}`;
          videoUrls.push(videoUrl);
          console.log(`🎬 Veo Client - Video ${n} URL:`, videoUrl);
        } else {
          console.log(`🎬 Veo Client - Video ${n} has no URI:`, video);
        }
      }
    } else {
      console.log('🎬 Veo Client - No generated videos in response');
      console.log('🎬 Veo Client - Full response:', operation.response);
    }
    
    console.log('🎬 Veo Client - Final video URLs:', videoUrls);
    return videoUrls;
  }
}

export const veoClient: IVeoClient = VeoClient.instance;

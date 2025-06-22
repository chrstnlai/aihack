import fs from "fs";
import Groq from "groq-sdk";

export class GroqClient {
  private groq: Groq;

  constructor() {
    this.groq = new Groq();
  }

  async transcribeFromFilePath(filePath: string) {
    try {
      // Validate file exists and has content
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error(`File is empty: ${filePath}`);
      }
      
      console.log(`🎵 Transcribing file: ${filePath} (${stats.size} bytes)`);
      
      const stream = fs.createReadStream(filePath);
      const transcription = await this.groq.audio.transcriptions.create({
        file: stream,
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
        language: "en",
        temperature: 0.0,
      });
      
      console.log(`✅ Transcription successful: "${transcription.text?.substring(0, 50)}..."`);
      return transcription;
    } catch (error: any) {
      console.error("-------- TRANSCRIPTION ERROR ---------");
      console.error("File path:", filePath);
      console.error("Error message:", error.message || error);
      console.error("Error details:", {
        name: error.name,
        code: error.code,
        status: error.status,
        statusText: error.statusText
      });
      console.error("----------------------------------------");
      return null;
    }
  }

  async detectEmojiFromTranscript(transcript: string) {
    try {
      if (!transcript || transcript.trim().length === 0) {
        console.log("⚠️ Empty transcript, returning default emoji");
        return "🎵";
      }
      
      console.log(`🎵 Detecting emoji for: "${transcript.substring(0, 50)}..."`);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an emoji detection system. Analyze the given transcript and return exactly one most relevant emoji that best represents the content, emotion, or theme. Only return the emoji character, nothing else."
          },
          {
            role: "user",
            content: `Analyze this transcript and return one relevant emoji: "${transcript}"`
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 5
      });
      
      const emoji = completion.choices[0]?.message?.content?.trim();
      console.log(`✅ Emoji detected: ${emoji || "🎵"}`);
      return emoji || "🎵";
    } catch (error: any) {
      console.error("-------- EMOJI DETECTION ERROR ---------");
      console.error("Transcript:", transcript?.substring(0, 100));
      console.error("Error message:", error.message || error);
      console.error("------------------------------------------");
      return "🎵";
    }
  }
}

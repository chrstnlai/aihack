import fs from "fs";
import Groq from "groq-sdk";

export class GroqClient {
  private groq: Groq;

  constructor() {
    this.groq = new Groq();
  }

  async transcribeFromFilePath(filePath: string) {
    try {
      const stream = fs.createReadStream(filePath);
      const transcription = await this.groq.audio.transcriptions.create({
        file: stream,
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
        language: "en",
        temperature: 0.0,
      });
      return transcription;
    } catch (error: any) {
      console.error("-------- ERROR ---------\n", error.message || error);
      return null;
    }
  }

  async detectEmojiFromTranscript(transcript: string) {
    try {
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
      return emoji || "🎵";
    } catch (error: any) {
      console.error("-------- EMOJI DETECTION ERROR ---------\n", error.message || error);
      return "🎵";
    }
  }
}

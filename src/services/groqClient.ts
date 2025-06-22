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
}

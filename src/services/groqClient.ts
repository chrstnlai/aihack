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

  async structureTranscript(transcript: string) {
    try {
      if (!transcript || transcript.trim().length === 0) {
        console.log("⚠️ Empty transcript, cannot structure");
        return null;
      }
      
      console.log(`📊 Structuring transcript: "${transcript.substring(0, 50)}..."`);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a dream analysis system that converts raw dream transcripts into detailed, structured JSON data.\n\nYour task is to analyze the transcript and create a comprehensive JSON structure that captures:\n1. A top-level 'title' field: a short, creative, AI-generated title for the dream.\n2. A top-level 'description' field: a vivid, AI-generated summary of the dream in 1-2 sentences.\n3. A 'details' field: a detailed structure that includes sequential order of events, all elements mentioned (people, places, objects, emotions), actions and interactions, environmental details, emotional states and themes, temporal relationships, spatial relationships, and symbolic elements.\n\nReturn ONLY valid JSON. Do not include any explanatory text, markdown formatting, or code blocks. The JSON should be immediately parseable.`
          },
          {
            role: "user",
            content: `Turn this raw transcript into a JSON. It should include a top-level title, a top-level description, and a detailed structure: "${transcript}"`
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 2000
      });
      
      const jsonString = completion.choices[0]?.message?.content?.trim();
      
      if (!jsonString) {
        console.error("❌ No response from Groq for transcript structuring");
        return null;
      }
      
      // Try to parse the JSON response
      try {
        const structuredData = JSON.parse(jsonString);
        console.log(`✅ Transcript structured successfully with ${Object.keys(structuredData).length} top-level keys`);
        return structuredData;
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        console.error("Raw response:", jsonString);
        return null;
      }
      
    } catch (error: any) {
      console.error("-------- TRANSCRIPT STRUCTURING ERROR ---------");
      console.error("Transcript:", transcript?.substring(0, 100));
      console.error("Error message:", error.message || error);
      console.error("------------------------------------------------");
      return null;
    }
  }
}

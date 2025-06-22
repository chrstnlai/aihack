import { NextResponse } from "next/server";
import fs from "fs";
import { GroqClient } from "@/services/groqClient";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
    try {
      const formData = await req.formData();
      const file = formData.get("audio") as File;
  
      if (!file) {
        console.error("❌ No file received in request");
        return NextResponse.json({ success: false, error: "No audio file provided" }, { status: 400 });
      }

      // Validate file size (minimum 1KB, maximum 50MB)
      const fileSize = file.size;
      if (fileSize < 1024) {
        console.error("❌ File too small:", fileSize, "bytes");
        return NextResponse.json({ success: false, error: "Audio file too small" }, { status: 400 });
      }
      if (fileSize > 50 * 1024 * 1024) {
        console.error("❌ File too large:", fileSize, "bytes");
        return NextResponse.json({ success: false, error: "Audio file too large" }, { status: 400 });
      }
  
      const buffer = Buffer.from(await file.arrayBuffer());
      const tmpDir = path.join(process.cwd(), "tmp");
  
      // Ensure tmp directory exists
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  
      // Determine file extension based on content type and filename
      let fileExtension = 'wav'; // Default to WAV
      const fileName = file.name?.toLowerCase() || '';
      const contentType = file.type?.toLowerCase() || '';
      
      if (contentType.includes('webm') || fileName.includes('.webm')) {
        fileExtension = 'webm';
      } else if (contentType.includes('mp3') || fileName.includes('.mp3')) {
        fileExtension = 'mp3';
      } else if (contentType.includes('ogg') || fileName.includes('.ogg')) {
        fileExtension = 'ogg';
      } else if (contentType.includes('m4a') || fileName.includes('.m4a')) {
        fileExtension = 'm4a';
      }
      
      const filePath = path.join(tmpDir, `${Date.now()}-audio.${fileExtension}`);
      
      console.log(`📁 Writing audio file: ${filePath}`);
      console.log(`📊 File info: size=${fileSize}, type=${contentType}, name=${fileName}`);
      
      await writeFile(filePath, buffer);
  
      const transcriber = new GroqClient();
      const result = await transcriber.transcribeFromFilePath(filePath);
  
      // Clean up temp file
      try {
        await unlink(filePath);
        console.log(`🗑️ Cleaned up temp file: ${filePath}`);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to cleanup temp file:", cleanupError);
      }
  
      if (result && result.text) {
        const emoji = await transcriber.detectEmojiFromTranscript(result.text);
        return NextResponse.json({ 
          success: true, 
          result,
          emoji,
          debug: {
            transcript: result.text,
            detectedEmoji: emoji,
            fileSize,
            fileType: contentType,
            fileName
          }
        });
      }
  
      return NextResponse.json({ success: true, result, emoji: "🎵" });
    } catch (err: any) {
      console.error("🔥 Transcription API Error:", err);
      
      // Provide more specific error messages
      let errorMessage = "Failed to process audio file";
      if (err.message?.includes("could not process file")) {
        errorMessage = "Invalid audio file format or corrupted file";
      } else if (err.message?.includes("file too large")) {
        errorMessage = "Audio file is too large";
      } else if (err.message?.includes("file too small")) {
        errorMessage = "Audio file is too small or empty";
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: err.message 
      }, { status: 500 });
    }
  }
  

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
  
      const buffer = Buffer.from(await file.arrayBuffer());
      const tmpDir = path.join(process.cwd(), "tmp");
  
      // Ensure tmp directory exists
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  
      const filePath = path.join(tmpDir, `${Date.now()}-audio.wav`);
      await writeFile(filePath, buffer);
  
      const transcriber = new GroqClient();
      const result = await transcriber.transcribeFromFilePath(filePath);
  
      await unlink(filePath);
  
      return NextResponse.json({ success: true, result });
    } catch (err: any) {
      console.error("🔥 Transcription API Error:", err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }
  

"use client";

import { useState, useRef, useCallback } from "react";
import { PlusIcon, PersonIcon, GridIcon } from "@radix-ui/react-icons";

interface RecordingPanelProps {
  onBack: () => void;
}

export default function RecordingPanel({ onBack }: RecordingPanelProps) {
  const [sidebarFocused, setSidebarFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasFinishedRecording, setHasFinishedRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [isStructuring, setIsStructuring] = useState(false);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  
  // Configuration constants
  const CHUNK_DURATION_MS = 5000; // 5 seconds - optimal balance of speed and reliability
  const MIN_CHUNK_SIZE_BYTES = 1024; // 1KB minimum for valid audio
  
  const continuousRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const continuousAudioChunks = useRef<Blob[]>([]);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunkCountRef = useRef<number>(0);
  const isStoppingRef = useRef<boolean>(false);

  const sidebarItems = [
    { icon: PlusIcon, label: "Add Dream" },
    { icon: GridIcon, label: "Dream Gallery" },
    { icon: PersonIcon, label: "Profile" },
  ];

  // Function to process transcript into structured JSON
  const processTranscriptToJSON = useCallback(async (transcript: string) => {
    if (!transcript || transcript.trim().length === 0) {
      console.warn("⚠️ No transcript to structure");
      return;
    }

    setIsStructuring(true);
    try {
      console.log("🔄 Processing transcript into structured JSON...");
      
      const response = await fetch('/api/structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.structuredData) {
        setStructuredData(data.structuredData);
        console.log("✅ Transcript structured successfully");
        
        // Automatically trigger video generation after JSON is created
        await generateVideoFromJSON(data.structuredData);
      } else {
        console.error("❌ Failed to structure transcript:", data.error);
      }
    } catch (err) {
      console.error("❌ Error structuring transcript:", err);
    } finally {
      setIsStructuring(false);
    }
  }, []);

  // Function to generate video from structured JSON
  const generateVideoFromJSON = useCallback(async (jsonData: any) => {
    if (!jsonData) {
      console.warn("⚠️ No JSON data to generate video from");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoUrls([]);
    
    try {
      console.log("🎬 Starting video generation from structured JSON...");
      
      const response = await fetch('/api/veo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: JSON.stringify(jsonData),
          options: {
            aspectRatio: "16:9",
            personGeneration: "allow_all",
            numberOfVideos: 1
          }
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.videoUrls) {
        setVideoUrls(data.videoUrls);
        console.log("✅ Video generated successfully:", data.videoUrls.length, "videos");
        
        // Save dream to localStorage after successful video generation
        await saveDreamToLocalStorage(jsonData, data.videoUrls[0]);
      } else {
        setVideoError(data.error || "Failed to generate video");
        console.error("❌ Video generation failed:", data.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setVideoError(errorMessage);
      console.error("❌ Error generating video:", err);
    } finally {
      setIsGeneratingVideo(false);
    }
  }, []);

  // Function to save dream to localStorage
  const saveDreamToLocalStorage = useCallback(async (structuredData: any, videoUrl: string) => {
    try {
      const dream = {
        id: crypto.randomUUID(),
        user_title: null, // User can edit this later
        ai_title: structuredData.title || "Untitled Dream",
        ai_description: structuredData.description || "A dream experience captured through voice and transformed into visual art.",
        transcript_raw: transcription || "",
        transcript_json: structuredData,
        video_url: videoUrl,
        video_thumbnail: null, // We'll generate this client-side later
        created_at: new Date().toISOString(),
        emojis: emojis
      };

      // Get existing dreams from localStorage
      const existingDreams = localStorage.getItem('dreams');
      const dreams = existingDreams ? JSON.parse(existingDreams) : [];
      
      // Add new dream to the beginning
      dreams.unshift(dream);
      
      // Save back to localStorage
      localStorage.setItem('dreams', JSON.stringify(dreams));
      
      console.log("✅ Dream saved to localStorage:", dream.id);
    } catch (error) {
      console.error("❌ Error saving dream to localStorage:", error);
    }
  }, [transcription, emojis]);

  // Function to create a new MediaRecorder with WAV format
  const createWavRecorder = useCallback((stream: MediaStream): MediaRecorder => {
    // Try to find a supported MIME type for WAV or fallback to default
    const mimeTypes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/webm;codecs=pcm',
      'audio/ogg;codecs=pcm'
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    // If no WAV-like format is supported, use default and we'll handle conversion
    if (!selectedMimeType) {
      console.log("No WAV format supported, using default MediaRecorder");
      return new MediaRecorder(stream);
    }
    
    console.log("Using MIME type:", selectedMimeType);
    return new MediaRecorder(stream, { mimeType: selectedMimeType });
  }, []);

  // Function to process a single chunk
  const processChunk = useCallback(async (audioBlob: Blob, chunkIndex: number) => {
    try {
      // Convert to WAV format if needed
      let wavBlob = audioBlob;
      if (!audioBlob.type.includes('wav') && !audioBlob.type.includes('wave')) {
        // For now, we'll use the blob as-is and let the server handle it
        // In a production app, you'd want to convert to WAV here
        wavBlob = new Blob([audioBlob], { type: 'audio/wav' });
      }
      
      const formData = new FormData();
      formData.append("audio", wavBlob, `chunk-${chunkIndex}.wav`);
      
      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await response.json();
      
      if (data.success && data.emoji) {
        setEmojis(prev => [...prev, data.emoji]);
        console.log(`✅ Chunk ${chunkIndex} processed successfully, emoji: ${data.emoji}`);
      } else {
        console.log(`⚠️ Chunk ${chunkIndex} processed but no emoji detected`);
      }
    } catch (err) {
      console.error(`❌ Error processing chunk ${chunkIndex}:`, err);
      // Silently skip failed chunks as requested
    }
  }, []);

  // Function to record a single chunk
  const recordChunk = useCallback(async (stream: MediaStream) => {
    if (isStoppingRef.current) return;
    
    const chunkIndex = chunkCountRef.current++;
    console.log(`🎙️ Starting chunk ${chunkIndex}`);
    
    const chunkRecorder = createWavRecorder(stream);
    const chunkBlobs: Blob[] = [];
    
    chunkRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunkBlobs.push(event.data);
      }
    };
    
    chunkRecorder.onstop = async () => {
      if (chunkBlobs.length > 0) {
        const chunkBlob = new Blob(chunkBlobs, { type: 'audio/wav' });
        console.log(`📦 Chunk ${chunkIndex} completed, size: ${chunkBlob.size} bytes`);
        
        // Validate chunk size before processing
        if (chunkBlob.size >= MIN_CHUNK_SIZE_BYTES) {
          // Process chunk asynchronously without blocking
          processChunk(chunkBlob, chunkIndex).catch(err => {
            console.error(`❌ Unhandled error in chunk ${chunkIndex}:`, err);
          });
        } else {
          console.warn(`⚠️ Chunk ${chunkIndex} too small (${chunkBlob.size} bytes), skipping`);
        }
      }
    };
    
    chunkRecorder.onerror = (event) => {
      console.error(`❌ Chunk ${chunkIndex} recording error:`, event);
    };
    
    // Record for configured duration
    chunkRecorder.start();
    
    // Stop after configured duration
    setTimeout(() => {
      if (chunkRecorder.state === 'recording') {
        chunkRecorder.stop();
      }
    }, CHUNK_DURATION_MS);
  }, [createWavRecorder, processChunk]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      isStoppingRef.current = false;
      chunkCountRef.current = 0;
      
      // Continuous recording for full transcript
      const continuousRecorder = createWavRecorder(stream);
      continuousRecorderRef.current = continuousRecorder;
      continuousAudioChunks.current = [];
      
      continuousRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          continuousAudioChunks.current.push(event.data);
        }
      };
      
      continuousRecorder.onstop = async () => {
        const completeBlob = new Blob(continuousAudioChunks.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", completeBlob, "complete-recording.wav");
        
        setIsProcessing(true);
        try {
          const response = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await response.json();
          if (data.success) {
            const transcriptText = data.result?.text || "";
            setTranscription(transcriptText);
            
            // Process transcript into structured JSON after successful transcription
            if (transcriptText.trim().length > 0) {
              await processTranscriptToJSON(transcriptText);
            }
          }
        } catch (err) {
          console.error("Error processing complete recording:", err);
        } finally {
          setIsProcessing(false);
        }
      };
      
      // Start continuous recording
      continuousRecorder.start();
      
      // Start chunk recording every configured interval
      chunkIntervalRef.current = setInterval(() => {
        if (!isStoppingRef.current) {
          recordChunk(stream);
        }
      }, CHUNK_DURATION_MS);
      
      // Record first chunk immediately
      recordChunk(stream);
      
      setIsRecording(true);
      setHasFinishedRecording(false);
      setTranscription(null);
      setEmojis([]);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    isStoppingRef.current = true;
    
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    
    continuousRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setIsRecording(false);
    setHasFinishedRecording(true);
  };

  const resetRecording = () => {
    setTranscription(null);
    setEmojis([]);
    setStructuredData(null);
    setVideoUrls([]);
    setVideoError(null);
    setHasFinishedRecording(false);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-white mt-6 text-center">
        <button
          onClick={onBack}
          className="absolute top-4 left-1/4 sm:top-40 sm:left-50 bg-white text-black px-3 py-1.5 rounded-full text-sm font-medium shadow-sm hover:bg-gray-100 transition z-50"
        >
          ⬅
        </button>

        <p className="text-xl mb-4">
          {isRecording 
            ? `🎙️ Recording in progress... (chunks every ${CHUNK_DURATION_MS/1000}s)` 
            : hasFinishedRecording 
              ? isProcessing ? "🔄 Processing complete recording..." : "✅ Recording completed!" 
              : "Tap to start recording"
          }
        </p>

        <div className="flex gap-4 justify-center mt-4">
          {!isRecording && !hasFinishedRecording ? (
            <button
              onClick={startRecording}
              className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-full font-medium transition"
            >
              Start Recording
            </button>
          ) : isRecording ? (
            <button
              onClick={stopRecording}
              className="bg-blue-500 text-white px-4 py-2 rounded-full"
            >
              Stop Recording
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={resetRecording}
                className="bg-gray-600 text-white px-4 py-2 rounded-full font-medium transition"
              >
                Record Again
              </button>
            </div>
          )}
        </div>

        {/* Show emojis during recording */}
        {isRecording && emojis.length > 0 && (
          <div className="mt-6 bg-gray-800/50 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2">🎵 Live Emojis:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {emojis.map((emoji, index) => (
                <span key={index} className="text-2xl" title={`Chunk ${index + 1}`}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Show complete transcript only after recording finishes */}
        {hasFinishedRecording && transcription && (
          <div className="mt-6 w-full max-w-2xl">
            <h3 className="text-white font-medium mb-3 text-lg">📝 Complete Dream Transcript:</h3>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-white/20 rounded-lg p-4">
              <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap overflow-auto max-h-96">
                {transcription.trim()}
              </pre>
            </div>
            
            {/* Show structured JSON data */}
            {isStructuring && (
              <div className="mt-4 bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                <p className="text-blue-300 font-medium mb-2">🔄 Processing transcript into structured JSON...</p>
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-300"></div>
                </div>
              </div>
            )}
            
            {structuredData && (
              <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-green-300 font-medium text-lg">📊 Structured Dream Data:</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(structuredData, null, 2));
                      // You could add a toast notification here
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    title="Copy JSON to clipboard"
                  >
                    📋 Copy JSON
                  </button>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 overflow-auto max-h-96">
                  <pre className="text-green-200 text-xs leading-relaxed whitespace-pre-wrap text-left">
                    {JSON.stringify(structuredData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Show video generation status and results */}
            {isGeneratingVideo && (
              <div className="mt-4 bg-purple-500/20 border border-purple-500/50 rounded-lg p-4">
                <p className="text-purple-300 font-medium mb-2">🎬 Video is being created...</p>
                <p className="text-purple-200 text-sm">This may take a few minutes. Please wait.</p>
              </div>
            )}
            
            {videoError && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <h3 className="text-red-300 font-medium mb-2">❌ Video Generation Error:</h3>
                <p className="text-red-200 text-sm">{videoError}</p>
              </div>
            )}
            
            {videoUrls.length > 0 && (
              <div className="mt-4 bg-purple-500/20 border border-purple-500/50 rounded-lg p-4">
                <h3 className="text-purple-300 font-medium mb-3 text-lg">🎬 Generated Dream Video:</h3>
                {videoUrls.map((url, index) => (
                  <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                    <video
                      controls
                      className="w-full rounded-lg"
                      style={{ maxHeight: '400px' }}
                    >
                      <source src={url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show final emoji summary */}
            {emojis.length > 0 && (
              <div className="mt-4 bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">🎵 Dream Emojis:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {emojis.map((emoji, index) => (
                    <span key={index} className="text-2xl" title={`Chunk ${index + 1}`}>
                      {emoji}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

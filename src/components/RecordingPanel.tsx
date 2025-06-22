"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { PlusIcon, PersonIcon, GridIcon, MoonIcon, GlobeIcon, SymbolIcon, MixIcon } from "@radix-ui/react-icons";
import { useDreamStore } from '../lib/dreamStore';
import { motion } from "framer-motion";

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
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  
  // Configuration constants
  const CHUNK_DURATION_MS = 5000; // 5 seconds - optimal balance of speed and reliability
  const MIN_CHUNK_SIZE_BYTES = 1024; // 1KB minimum for valid audio
  const RECORDING_LIMIT_MS = 60000; // 1 minute
  
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

  const addDream = useDreamStore((state) => state.addDream);

  // Timer for recording progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      const start = Date.now();
      interval = setInterval(() => {
        const elapsed = Date.now() - start;
        setRecordingProgress(Math.min(elapsed / RECORDING_LIMIT_MS, 1));
        if (elapsed >= RECORDING_LIMIT_MS) {
          stopRecording();
        }
      }, 100);
    } else {
      setRecordingProgress(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Function to process transcript into structured JSON
  const processTranscriptToJSON = useCallback(async (transcript: string) => {
    if (!transcript || transcript.trim().length === 0) {
      console.warn("⚠️ No transcript to structure");
      return;
    }

    setIsStructuring(true);
    setIsProcessing(true);
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
        setIsProcessing(false);
        console.log("✅ Transcript structured successfully");
        
        // Automatically trigger video generation after JSON is created
        await generateVideoFromJSON(data.structuredData);
      } else {
        setIsProcessing(false);
        console.error("❌ Failed to structure transcript:", data.error);
      }
    } catch (err) {
      setIsProcessing(false);
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
        
        // Save dream to Supabase after successful video generation
        await saveDreamToSupabase(jsonData, data.videoUrls[0]);
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

  // Helper to extract first frame as base64 image
  const extractVideoThumbnail = (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0;
      video.addEventListener('loadeddata', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } else {
            resolve(null);
          }
        } catch (err) {
          resolve(null);
        }
      });
      video.addEventListener('error', () => resolve(null));
    });
  };

  // Function to save dream to Supabase
  const saveDreamToSupabase = useCallback(async (structuredData: any, videoUrl: string) => {
    const latestEmojis = [...emojis];
    let video_thumbnail: string | null = null;
    try {
      video_thumbnail = await extractVideoThumbnail(videoUrl);
    } catch (err) {
      video_thumbnail = null;
    }
    if (!video_thumbnail) {
      video_thumbnail = "/dreambackground1.png";
    }
    const dream = {
      user_title: null,
      ai_title: videoTitle || structuredData.title || "Untitled Dream",
      ai_description: structuredData.description || "A dream experience captured through voice and transformed into visual art.",
      transcript_raw: transcription || "",
      transcript_json: structuredData,
      video_url: videoUrl,
      video_thumbnail,
      emojis: latestEmojis,
    };
    await addDream(dream);
  }, [transcription, emojis, addDream, videoTitle]);

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
    <div className="flex flex-col items-center w-full h-full p-2">
      {(!isRecording && !hasFinishedRecording) ? (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 w-full max-w-xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Left: Large MoonIcon */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
              <MoonIconFilled progress={0} size={192} useGradient={false} />
            </div>
          </div>
          {/* Right: Text and Button */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-white text-lg mb-2">Ready to record your dream?</p>
            <p className="text-gray-300 text-sm mb-6">Tap below to start recording and bring your subconscious to life.</p>
            <button
              onClick={startRecording}
              className="bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-full font-medium transition"
            >
              Let's start!
            </button>
          </div>
        </div>
      ) : isRecording ? (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 w-full max-w-xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Left: Animated MoonIcon with fill */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
              <MoonIconFilled progress={recordingProgress} size={192} useGradient={true} />
            </div>
          </div>
          {/* Right: Text and Controls */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-xl text-white text-center mb-4">
              {`🎙️ Recording in progress... (${Math.round((1-recordingProgress)*60)}s left)`}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={stopRecording}
                className="bg-red-500 opacity-50 hover:opacity-100 border border-white/20 text-white px-4 py-2 rounded-full"
              >
                Stop recording
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 w-full max-w-xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Left: Icon based on processing step */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
              {isProcessing ? (
                <GlobeIcon className="w-20 h-20 md:w-32 md:h-32 text-white opacity-30" />
              ) : isGeneratingVideo ? (
                <SymbolIcon className="w-20 h-20 md:w-32 md:h-32 text-white opacity-30" />
              ) : (
                <MixIcon className="w-28 h-28 md:w-40 md:h-40 text-white opacity-60" />
              )}
            </div>
          </div>
          {/* Right: Status text and controls */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-xl text-white text-center mb-4">
              {isProcessing
                ? "Translating your thoughts..."
                : isGeneratingVideo
                  ? "Creating your dream video..."
                  : videoTitle
                    ? (<span><span className="font-bold">{videoTitle}</span> has been successfully created!</span>)
                    : "Your dream has been created!"}
            </p>
            {isGeneratingVideo && (
              <>
                <p className="text-white text-opacity-70 text-sm mb-2">This may take from 15 seconds to 2 minutes to generate.</p>
                <div className="mb-2">
                  {videoTitle ? (
                    <span className="text-white text-base text-xs opacity-50 font-light">{videoTitle} is being created...</span>
                  ) : (
                    <button
                      className="text-blue-300 underline text-sm hover:text-blue-400 transition"
                      onClick={() => setTitleDialogOpen(true)}
                    >
                      Add a title to your dream
                    </button>
                  )}
                </div>
                {titleDialogOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" aria-hidden="true" onClick={() => setTitleDialogOpen(false)} />
                    <div className="relative bg-white rounded-lg p-6 w-full max-w-xs mx-auto flex flex-col items-center z-10">
                      <div className="text-md font-semibold mb-2 text-black">Name your dream video</div>
                      <input
                        type="text"
                        value={videoTitle}
                        onChange={e => setVideoTitle(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 mb-4 text-black bg-white"
                        placeholder="Enter a title..."
                      />
                      <div className="flex gap-2">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                          onClick={() => setTitleDialogOpen(false)}
                        >
                          Save
                        </button>
                        <button
                          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-1 rounded"
                          onClick={() => setTitleDialogOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex gap-4 justify-center">
              {isProcessing || isGeneratingVideo ? (
                <button
                  onClick={resetRecording}
                  className="bg-gray-600 text-white px-4 py-2 rounded-full font-medium transition"
                >
                  Cancel the process
                </button>
              ) : (
                <button
                  onClick={onBack}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium transition"
                >
                  See my beautiful work {" "}↗
                </button>
              )}
            </div>
            {/* Show all details if debug menu is open (placeholder for now) */}
            {/* TODO: Implement debug menu state and details rendering */}
          </div>
        </div>
      )}
      {debugMenuOpen && (
        <div className="w-full flex justify-center mt-2">
          <span className="text-white opacity-20 text-sm">Debug menu open</span>
        </div>
      )}
    </div>
  );
}

// Refactored MoonIconFilled: solid color in dormant state, linear gradient during recording
function MoonIconFilled({ progress = 0, size = 192, useGradient = false }: { progress: number, size?: number, useGradient?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outline */}
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="none" stroke="#d1d5db" strokeWidth="2" />
      {useGradient ? (
        <>
          <defs>
            <linearGradient id="moon-fill-gradient" x1="0" y1="24" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <motion.stop
                initial={{ offset: 1 }}
                animate={{ offset: 1 - progress }}
                transition={{ duration: 0, ease: 'linear' }}
                stopColor="#F0C420"
                stopOpacity="1"
              />
              <stop offset="1" stopColor="#F0C420" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="url(#moon-fill-gradient)" />
        </>
      ) : (
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="#d1d5db" />
      )}
    </svg>
  );
}

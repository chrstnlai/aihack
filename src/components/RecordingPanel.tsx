"use client";

import { useState, useRef } from "react";
import { PlusIcon, PersonIcon, GridIcon } from "@radix-ui/react-icons";

interface RecordingPanelProps {
  onBack: () => void;
}

export default function RecordingPanel({ onBack }: RecordingPanelProps) {
  const [sidebarFocused, setSidebarFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [emojis, setEmojis] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const sidebarItems = [
    { icon: PlusIcon, label: "Add Dream" },
    { icon: GridIcon, label: "Dream Gallery" },
    { icon: PersonIcon, label: "Profile" },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
  
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const blob = new Blob([event.data], { type: "audio/wav" });
          const formData = new FormData();
          formData.append("audio", blob, `chunk-${Date.now()}.wav`);
  
          try {
            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });
  
            const data = await response.json();
            
            if (data.success) {
              setTranscription((prev) => `${prev ?? ""} ${data.result?.text ?? ""}`);
              
              if (data.emoji) {
                setEmojis((prev) => [...prev, data.emoji]);
                console.log("🎵 Emoji detected:", data.emoji, "for transcript:", data.debug?.transcript);
              }
            }
          } catch (err) {
            console.error("Error uploading chunk:", err);
          }
        }
      };
  
      mediaRecorder.start(5000);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };
  

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
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
          {isRecording ? "🎙️ Recording in progress..." : "Tap to start recording"}
        </p>

        <div className="flex gap-4 justify-center mt-4">
  {!isRecording ? (
    <button
      onClick={startRecording}
      className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-full font-medium transition"
    >
      Start Recording
    </button>
  ) : (
    <button
      onClick={stopRecording}
      className="bg-blue-500 text-white px-4 py-2 rounded-full"
    >
      Stop Recording
    </button>
  )}
</div>

        {emojis.length > 0 && (
          <div className="mt-6 bg-gray-800/50 p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2">🎵 Detected Emojis:</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {emojis.map((emoji, index) => (
                <span key={index} className="text-2xl" title={`Chunk ${index + 1}`}>
                  {emoji}
                </span>
              ))}
            </div>
          </div>
        )}

        {transcription && (
          <pre className="mt-6 bg-gray-800 text-white p-4 rounded text-sm max-w-xl overflow-auto whitespace-pre-wrap">
            {transcription}
          </pre>
        )}
      </div>

      {/* Bottom Sidebar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <div
          className={`flex items-center gap-2 md:gap-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-full px-3 py-2 transition-all duration-300 ${
            sidebarFocused ? "opacity-100 scale-105" : "opacity-60 hover:opacity-80"
          }`}
          onMouseEnter={() => setSidebarFocused(true)}
          onMouseLeave={() => setSidebarFocused(false)}
          onFocus={() => setSidebarFocused(true)}
          onBlur={() => setSidebarFocused(false)}
        >
          {sidebarItems.map((item, index) => (
            <button
              key={index}
              className={`p-1.5 md:p-2 rounded-full transition-all duration-200 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:outline-none ${
                index === 0 ? "bg-gray-700/30" : ""
              }`}
              title={item.label}
            >
              <item.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

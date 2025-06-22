"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import RecordingPanel from "@/components/RecordingPanel";
import { Input } from "@/components/ui/input";

import { 
  PlusIcon, 
  PersonIcon, 
  GridIcon,
  GearIcon
  
} from "@radix-ui/react-icons"

interface DashboardProps {
  appLogo?: string
  userName?: string
}

export default function Dashboard({ appLogo = "✦", userName = "Christine" }: DashboardProps) {
  const [sidebarFocused, setSidebarFocused] = useState(false)
  const [hasClickedRecord, setHasClickedRecord] = useState(false);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [veoInput, setVeoInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [veoResult, setVeoResult] = useState<string | null>(null);
  const [veoError, setVeoError] = useState<string | null>(null);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const sidebarItems = [
    { icon: PlusIcon, label: "Add" },
    { icon: GridIcon, label: "Favorites" },
    { icon: PersonIcon, label: "Profile" },
  ]
  const [backgroundImage, setBackgroundImage] = useState("/dreambackground1.png");

  const backgrounds = [
    "/dreambackground1.png",
    "/dreambackground2.png",
    "/dreambackground3.png",
    "/dreambackground4.png",
  ];

  // Pick a random one on first render
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    setBackgroundImage(backgrounds[randomIndex]);
  }, []);

  const handleVeoSubmit = async () => {
    if (!veoInput.trim()) return;
    
    setIsProcessing(true);
    setVeoError(null);
    setVeoResult(null);
    setVideoUrls([]);
    setDebugInfo(null);
    
    try {
      const response = await fetch('/api/veo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: veoInput,
          options: {
            aspectRatio: "16:9",
            personGeneration: "dont_allow",
            numberOfVideos: 1
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate video');
      }
      
      setVeoResult(`Success! Generated ${data.videoUrls.length} video(s)`);
      setVideoUrls(data.videoUrls);
      setDebugInfo(data.debug);
    } catch (error) {
      setVeoError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
    {/* Dot pattern background */}
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }}
    />
    {/* Image background */}
    <div
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          zIndex: 0,
        }}
      />

    {/* Main layer */}
    <div className="relative z-10 flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-3 md:p-4">
        {/* Debug Mode Toggle */}
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg z-50 relative"
        >
          {debugMode ? "🔴 DEBUG ON" : "⚪ DEBUG OFF"}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-3 md:p-6">
        <div className="w-full max-w-2xl">
          {debugMode ? (
            // Debug Interface
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 md:p-8 shadow-lg">
              <h2 className="text-white text-xl font-semibold mb-4 text-center">
                🔧 Veo Client Debug
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Transcript/Prompt:
                  </label>
                  <textarea
                    value={veoInput}
                    onChange={(e) => setVeoInput(e.target.value)}
                    placeholder="Enter your dream description or transcript here..."
                    className="w-full bg-gray-900/50 border border-gray-700/50 text-white placeholder:text-gray-500 p-3 rounded-lg focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-all duration-200 min-h-[100px] resize-y"
                    disabled={isProcessing}
                  />
                </div>
                
                <button
                  onClick={handleVeoSubmit}
                  disabled={isProcessing || !veoInput.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? "🔄 Processing..." : "🚀 Generate Video"}
                </button>
                
                {isProcessing && (
                  <div className="text-center text-yellow-300 text-sm">
                    ⏳ This may take a few minutes. Please wait...
                  </div>
                )}
                
                {veoError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-300 font-medium">❌ Error:</p>
                    <p className="text-red-200 text-sm mt-1">{veoError}</p>
                  </div>
                )}
                
                {veoResult && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                    <p className="text-green-300 font-medium">✅ Success:</p>
                    <p className="text-green-200 text-sm mt-1">{veoResult}</p>
                  </div>
                )}
                
                {/* Video Display */}
                {videoUrls.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">🎬 Generated Videos:</h3>
                    {videoUrls.map((url, index) => (
                      <div key={index} className="bg-gray-900/50 rounded-lg p-3">
                        <p className="text-gray-300 text-sm mb-2">Video {index + 1}:</p>
                        <video
                          controls
                          className="w-full rounded-lg"
                          style={{ maxHeight: '300px' }}
                        >
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        <a
                          href={url}
                          download={`dream-video-${index + 1}.mp4`}
                          className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          📥 Download Video
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Debug Information */}
                {debugInfo && (
                  <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-3">
                    <h3 className="text-white font-medium mb-2">🔍 Debug Info:</h3>
                    <div className="text-gray-300 text-xs space-y-1">
                      <p><strong>Request Transcript:</strong> {debugInfo.requestTranscript}</p>
                      <p><strong>Request Options:</strong> {JSON.stringify(debugInfo.requestOptions)}</p>
                      <p><strong>Response Count:</strong> {debugInfo.responseCount}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setDebugMode(false)}
                className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ← Back to Main
              </button>
            </div>
          ) : !hasClickedRecord ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 md:p-8 shadow-lg flex flex-col items-center transition-all duration-300">
              <p className="text-white text-lg md:text-xl font-semibold mb-4 text-center">
                DREAMSCAPE
              </p>
              <p className="text-center text-base md:text-lg font-light text-white p-6">
                Your subconscious comes to life. Record your dreams with just your voice, and
                watch as your words transform into vivid, surreal visualizations—turning your
                dreams into something you can see, feel, and explore.
              </p>
              <button
                className="bg-white text-black px-4 py-2 rounded-full text-lg font-medium shadow-sm hover:bg-gray-100 transition mb-6"
                onClick={() => setHasClickedRecord(true)}
              >
                Record Dream
              </button>
            </div>
          ) : (
            <RecordingPanel onBack={() => setHasClickedRecord(false)} />
          )}
        </div>
      </main>
    </div>
  </div>
  )
} 
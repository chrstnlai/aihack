"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import RecordingPanel from "@/components/RecordingPanel";

import { 
  PlusIcon, 
  PersonIcon, 
  GridIcon
  
} from "@radix-ui/react-icons"

interface DashboardProps {
  appLogo?: string
  userName?: string
}

export default function Dashboard({ appLogo = "✦", userName = "Christine" }: DashboardProps) {
  const [sidebarFocused, setSidebarFocused] = useState(false)
  const [hasClickedRecord, setHasClickedRecord] = useState(false);
  const [showRecordingPanel, setShowRecordingPanel] = useState(false);
  const sidebarItems = [
    { icon: PlusIcon, label: "Add" },
    { icon: GridIcon, label: "Favorites" },
    { icon: PersonIcon, label: "Profile" },
  ]
  const [backgroundImage, setBackgroundImage] = useState("/backgrounds/dreambackground1.png");

  const backgrounds = [
    "/backgrounds/dreambackground1.png",
    "/backgrounds/dreambackground2.png",
    "/backgrounds/dreambackground3.png",
    "/backgrounds/dreambackground4.png",
    "/backgrounds/video.mp4",
  ];

  // Pick a random one on first render
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    setBackgroundImage(backgrounds[randomIndex]);
  }, []);
  //initilizing Groq client
  // const groq = new Groq();

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
      
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-3 md:p-6">
        <div className="w-full max-w-2xl">
          {!hasClickedRecord ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 md:p-8 shadow-lg flex flex-col items-center transition-all duration-300">
              <p className="text-white text-lg md:text-xl font-semibold mb-4 text-center">
                DREAMSCAPE
              </p>
              <p className="text-center text-base md:text-lg font-light text-white p-6">
                Your subconscious comes to life. Record your dreams with just your voice, and
                watch as your words transform into vivid, surreal visualizations,turning your
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
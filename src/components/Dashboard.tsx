"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { 
  PlusIcon, 
  HomeIcon, 
  MagnifyingGlassIcon, 
  GearIcon, 
  PersonIcon, 
  FileTextIcon, 
  HeartIcon 
} from "@radix-ui/react-icons"

interface DashboardProps {
  appLogo?: string
  userName?: string
}

export default function Dashboard({ appLogo = "✦", userName = "Christine" }: DashboardProps) {
  const [sidebarFocused, setSidebarFocused] = useState(false)

  const sidebarItems = [
    { icon: PlusIcon, label: "Add" },
    { icon: HomeIcon, label: "Home" },
    { icon: MagnifyingGlassIcon, label: "Search" },
    { icon: FileTextIcon, label: "Files" },
    { icon: GearIcon, label: "Settings" },
    { icon: HeartIcon, label: "Favorites" },
    { icon: PersonIcon, label: "Profile" },
  ]

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Dot pattern background layer */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Main background layer */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-3">
            <div className="text-xl font-bold">{appLogo}</div>
            <h1 className="text-base md:text-lg font-light">Nice to see you, {userName}</h1>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm md:text-base mb-6">
                Double-click anywhere to create a new Block, or start with...
              </p>
            </div>

            {/* Main Input */}
            <div className="relative">
              <Input
                placeholder="Start typing or double-click to create..."
                className="w-full bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 h-10 md:h-12 text-sm md:text-base px-3 md:px-4 rounded-lg focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-all duration-200"
              />
            </div>
          </div>
        </main>

        {/* Bottom Horizontal Sidebar */}
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
    </div>
  )
} 
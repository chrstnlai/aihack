import { PlusIcon, PersonIcon, GridIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import fs from "fs";
import Groq from "groq-sdk";

interface RecordingPanelProps {
  onBack: () => void;
}

export default function RecordingPanel({ onBack }: RecordingPanelProps) {
  const [sidebarFocused, setSidebarFocused] = useState(false);

  const sidebarItems = [
    { icon: PlusIcon, label: "Add Dream" },
    { icon: GridIcon, label: "Dream Gallery" },
    { icon: PersonIcon, label: "Profile" },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="text-white mt-6 text-center">
      <button
  onClick={onBack}
  className="absolute top-4 left-1/4 sm:top-40 sm:left-50 bg-white text-black px-3 py-1.5 rounded-full text-sm font-medium shadow-sm hover:bg-gray-100 transition z-50"
>
  ⬅
</button>
        <p className="text-xl mb-4">🎙️ Recording in progress...</p>
        
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

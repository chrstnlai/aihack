"use client"

import { useState, useEffect, useRef } from "react"

interface Dream {
  id: string
  user_title: string | null
  ai_title: string
  ai_description: string
  transcript_raw: string
  transcript_json: any
  video_url: string
  video_thumbnail: string | null
  created_at: string
  emojis: string[]
}

interface DreamDetailsProps {
  dream: Dream
  onBack: () => void
  onEditTitle?: (newTitle: string) => void
  onDelete?: () => void
}

export default function DreamDetails({ dream, onBack, onEditTitle, onDelete }: DreamDetailsProps) {
  const [showVideoOverlay, setShowVideoOverlay] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(dream.user_title || "")
  const [extraThumb1, setExtraThumb1] = useState<string | null>(null)
  const [extraThumb2, setExtraThumb2] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const extractFrame = (video: HTMLVideoElement, time: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      video.currentTime = time;
      const onSeeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('No canvas context');
        }
        video.removeEventListener('seeked', onSeeked);
      };
      video.addEventListener('seeked', onSeeked);
    });
  };

  useEffect(() => {
    if (!dream.video_url) return;
    let cancelled = false;
    const video = document.createElement('video');
    video.src = dream.video_url;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('loadedmetadata', async () => {
      if (video.duration && video.duration > 2) {
        const t1 = video.duration * 0.5;
        const t2 = video.duration * 0.9;
        try {
          const [thumb1, thumb2] = await Promise.all([
            extractFrame(video, t1),
            extractFrame(video, t2),
          ]);
          if (!cancelled) {
            setExtraThumb1(thumb1);
            setExtraThumb2(thumb2);
          }
        } catch (e) {
          // Ignore errors
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dream.video_url]);

  const copyToClipboard = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // Simple alert for now - you can replace with a proper toast system later
      alert(`${type} copied to clipboard!`)
    } catch (err) {
      alert("Failed to copy to clipboard")
    }
  }

  const formatEmojis = (emojis: string[]) => {
    return emojis.join(" ")
  }

  const handleSaveTitle = () => {
    if (onEditTitle) {
      onEditTitle(editedTitle)
    }
    setIsEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setEditedTitle(dream.user_title || "")
    setIsEditingTitle(false)
  }

  return (
    <div className="min-h-screen p-6">
      {/* No back button */}

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
        <div className="w-full mx-auto flex flex-col lg:grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Dream Thumbnail */}
          <div className="lg:col-span-2">
            <div>
              <div className="relative">
                <img
                  src={dream.video_thumbnail || "/dreambackground1.png"}
                  alt="Dream visualization"
                  className="w-full aspect-video object-cover"
                />
                <button
                  onClick={() => setShowVideoOverlay(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <span className="text-white text-2xl">▶️</span>
                  </div>
                </button>
              </div>
              {/* Extra thumbnails below main thumbnail, all same size, no extra container */}
              {extraThumb1 && (
                <img src={extraThumb1} alt="Middle frame" className="w-full aspect-video object-cover rounded border border-gray-700 mt-3" />
              )}
              {extraThumb2 && (
                <img src={extraThumb2} alt="End frame" className="w-full aspect-video object-cover rounded border border-gray-700 mt-3" />
              )}
            </div>
          </div>

          {/* Right Panel - Dream Metadata */}
          <div className="space-y-6">
            {/* AI Title Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Dream Title</h3>
              <div className="text-white font-medium">{dream.ai_title}</div>
              
              {/* User Title Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Your Title</h4>
                {isEditingTitle ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-600 text-white px-3 py-2 rounded text-sm"
                      placeholder="Enter your title..."
                    />
                    <div className="flex gap-2">
                      <span
                        onClick={handleSaveTitle}
                        className="underline text-green-500 hover:text-green-700 cursor-pointer text-sm mr-2"
                        style={{border: 'none', background: 'none', padding: 0, margin: 0}}
                      >
                        Save ↗
                      </span>
                      <span
                        onClick={handleCancelEdit}
                        className="underline text-gray-400 hover:text-gray-600 cursor-pointer text-sm"
                        style={{border: 'none', background: 'none', padding: 0, margin: 0}}
                      >
                        Cancel ↗
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-300 text-sm">
                      {dream.user_title || "No title provided"}
                    </div>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Description</h3>
              <div className="text-gray-300 text-sm leading-relaxed">{dream.ai_description}</div>
            </div>

            {/* Transcripts Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Transcripts</h3>
              <div className="space-y-2">
                <span
                  onClick={() => copyToClipboard(dream.transcript_raw, "Raw transcript")}
                  className="w-full underline text-blue-300 hover:text-blue-400 cursor-pointer text-sm flex items-center"
                  style={{border: 'none', background: 'none', padding: 0, margin: 0}}
                >
                  Raw transcript ↗
                </span>
                <span
                  onClick={() => copyToClipboard(JSON.stringify(dream.transcript_json, null, 2), "JSON transcript")}
                  className="w-full underline text-blue-300 hover:text-blue-400 cursor-pointer text-sm flex items-center"
                  style={{border: 'none', background: 'none', padding: 0, margin: 0}}
                >
                  JSON transcript ↗
                </span>
              </div>
            </div>

            {/* Video Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Video</h3>
              <span
                onClick={() => setShowVideoOverlay(true)}
                className="w-full underline text-blue-300 hover:text-blue-400 cursor-pointer text-sm flex "
                style={{border: 'none', background: 'none', padding: 0, margin: 0}}
              >
                Play video ↗
              </span>
            </div>

            {/* Emojis Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Emojis</h3>
              <div className="text-2xl leading-relaxed break-words">{formatEmojis(dream.emojis)}</div>
            </div>

            {/* Delete Section */}
            {onDelete && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Actions</h3>
                <span
                  onClick={onDelete}
                  className="w-full underline text-red-400 hover:text-red-600 cursor-pointer text-sm flex items-center"
                  style={{border: 'none', background: 'none', padding: 0, margin: 0}}
                >
                  Delete
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Overlay */}
      {showVideoOverlay && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setShowVideoOverlay(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20 p-2 rounded"
            >
              ✕
            </button>
            <video
              src={dream.video_url}
              controls
              autoPlay
              className="w-full h-auto rounded-lg"
              onError={() => {
                alert("Could not load the video. Please try again later.")
              }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  )
} 
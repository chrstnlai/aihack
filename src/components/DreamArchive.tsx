"use client"

import { useState, useEffect } from "react"
import DreamDetails from "./DreamDetails"

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

interface DreamArchiveProps {
  onBack: () => void
}

export default function DreamArchive({ onBack }: DreamArchiveProps) {
  const [dreams, setDreams] = useState<Dream[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState("")
  
  const dreamsPerPage = 16
  const totalPages = Math.ceil(dreams.length / dreamsPerPage)
  const startIndex = (currentPage - 1) * dreamsPerPage
  const endIndex = startIndex + dreamsPerPage
  const currentDreams = dreams.slice(startIndex, endIndex)

  useEffect(() => {
    loadDreams()
  }, [])

  const loadDreams = () => {
    try {
      const savedDreams = localStorage.getItem('dreams')
      if (savedDreams) {
        const parsedDreams = JSON.parse(savedDreams)
        setDreams(parsedDreams.sort((a: Dream, b: Dream) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      }
    } catch (error) {
      console.error('Error loading dreams:', error)
    }
  }

  const saveDreams = (updatedDreams: Dream[]) => {
    try {
      localStorage.setItem('dreams', JSON.stringify(updatedDreams))
      setDreams(updatedDreams)
    } catch (error) {
      console.error('Error saving dreams:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${month}.${day}.${year}`
  }

  const handleEditTitle = (dreamId: string, newTitle: string) => {
    const updatedDreams = dreams.map(dream => 
      dream.id === dreamId 
        ? { ...dream, user_title: newTitle || null }
        : dream
    )
    saveDreams(updatedDreams)
    setIsEditingTitle(null)
  }

  const handleDeleteDream = (dreamId: string) => {
    if (confirm('Are you sure you want to delete this dream?')) {
      const updatedDreams = dreams.filter(dream => dream.id !== dreamId)
      saveDreams(updatedDreams)
      setSelectedDream(null)
    }
  }

  const startTitleEdit = (dream: Dream) => {
    setIsEditingTitle(dream.id)
    setEditedTitle(dream.user_title || "")
  }

  const cancelTitleEdit = () => {
    setIsEditingTitle(null)
    setEditedTitle("")
  }

  if (selectedDream) {
    return (
      <DreamDetails
        dream={selectedDream}
        onBack={() => setSelectedDream(null)}
        onEditTitle={(newTitle) => handleEditTitle(selectedDream.id, newTitle)}
        onDelete={() => handleDeleteDream(selectedDream.id)}
      />
    )
  }

  return (
    <div className="w-full h-full p-2">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        {/* No back button here anymore */}
      </div>

      {dreams.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 text-center">
          <p className="text-white text-lg mb-2">No dreams saved yet</p>
          <p className="text-gray-300 text-sm">Record your first dream to see it here!</p>
        </div>
      ) : (
        <>
          {/* Dreams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {currentDreams.map((dream) => (
              <div
                key={dream.id}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden cursor-pointer hover:bg-white/20 transition-all duration-200"
                onClick={() => setSelectedDream(dream)}
              >
                {/* Thumbnail */}
                <div className="aspect-video relative">
                  <img
                    src={dream.video_thumbnail || "/dreambackground1.png"}
                    alt="Dream thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-2xl">👁️</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Date */}
                  <h3 className="text-white text-base font-medium mb-2">
                    {formatDate(dream.created_at)}
                  </h3>

                  {/* User Title */}
                  <div className="mb-3">
                    {isEditingTitle === dream.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="w-full bg-gray-900/50 border border-gray-600 text-white px-3 py-2 rounded text-sm"
                          placeholder="Enter title..."
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditTitle(dream.id, editedTitle)
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cancelTitleEdit()
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-gray-300 text-sm opacity-100">
                          {dream.user_title || "No title provided"}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startTitleEdit(dream)
                          }}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI Description */}
                  <p className="text-gray-300 text-sm opacity-60 line-clamp-3">
                    {dream.ai_description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
              >
                Previous
              </button>
              
              <span className="text-white text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 
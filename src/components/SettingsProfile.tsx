"use client"

import { useState, useCallback, useEffect } from "react"

interface FormData {
  selfDescription: string
  triggersAndBoundaries: string
  visualStyle: string
}

const LOCAL_STORAGE_KEY = "dreamer_profile"

export default function SettingsProfile() {
  const [formData, setFormData] = useState<FormData>({
    selfDescription: "",
    triggersAndBoundaries: "",
    visualStyle: "",
  })

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      setFormData(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage
  const autoSave = useCallback(async (data: FormData) => {
    setSaveStatus("saving")
    await new Promise((resolve) => setTimeout(resolve, 800))
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
    setSaveStatus("saved")
    setLastSaved(new Date())
    setTimeout(() => setSaveStatus("idle"), 2000)
  }, [])

  const handleFieldChange = useCallback(
    (field: keyof FormData, value: string) => {
      const updatedData = { ...formData, [field]: value }
      setFormData(updatedData)
    },
    [formData],
  )

  const handleBlur = useCallback(
    (field: keyof FormData, value: string) => {
      const updatedData = { ...formData, [field]: value }
      autoSave(updatedData)
    },
    [formData, autoSave],
  )

  const handleClearAll = () => {
    setFormData({ selfDescription: "", triggersAndBoundaries: "", visualStyle: "" })
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setSaveStatus("idle")
    setLastSaved(null)
  }

  const visualStyleOptions = [
    { value: "surreal", label: "Surreal" },
    { value: "realistic", label: "Realistic" },
    { value: "cartoonish", label: "Cartoonish" },
    { value: "abstract", label: "Abstract" },
  ]

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="border border-gray-700 rounded-sm p-6 space-y-6 bg-black/30">
        {/* Self Description */}
        <div className="space-y-2">
          <label htmlFor="self-description" className="block font-medium text-white">Self-description</label>
          <input
            type="text"
            value={formData.selfDescription}
            onChange={e => handleFieldChange("selfDescription", e.target.value)}
            onBlur={e => handleBlur("selfDescription", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-black bg-white"
            placeholder="Describe yourself..."
          />
        </div>

        {/* Triggers and Boundaries */}
        <div className="space-y-2">
          <label htmlFor="triggers-boundaries" className="block font-medium text-white">Triggers and Boundaries</label>
          <textarea
            id="triggers-boundaries"
            placeholder="White fluffy dogs, girls shorter than 5 foot"
            value={formData.triggersAndBoundaries}
            onChange={e => handleFieldChange("triggersAndBoundaries", e.target.value)}
            onBlur={e => handleBlur("triggersAndBoundaries", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mb-2 text-black bg-white"
          />
        </div>

        {/* Visual/Artistic Style */}
        <div className="space-y-3">
          <label className="block font-medium text-white">Visual/Artistic Style</label>
          <div className="flex gap-6">
            {visualStyleOptions.map((option) => (
              <span
                key={option.value}
                onClick={() => {
                  handleFieldChange("visualStyle", option.value)
                  handleBlur("visualStyle", option.value)
                }}
                className={`cursor-pointer transition-opacity ${
                  formData.visualStyle === option.value ? "opacity-100" : "opacity-20 hover:opacity-40"
                } text-white`}
              >
                {option.label}
              </span>
            ))}
          </div>
        </div>

        {/* Save/Clear Status */}
        <div className="flex items-center gap-2 text-sm text-gray-400 pt-4 border-t border-gray-700">
          <button
            className="ml-auto text-xs text-red-500 hover:underline"
            onClick={handleClearAll}
          >
            Clear all
          </button>
          {saveStatus === "saving" && <span className="font-berstein">Saving...</span>}
          {saveStatus === "saved" && <span className="text-green-600 font-berstein">Saved</span>}
          {lastSaved && saveStatus === "idle" && <span className="font-berstein">Last saved: {lastSaved.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Debug Info Accordion */}
      <div className="mt-6">
        <button
          className="text-xs text-gray-400 hover:underline focus:outline-none"
          onClick={() => setShowDebug((prev) => !prev)}
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
        {showDebug && (
          <div className="bg-gray-800/50 rounded mt-2 p-4">
            <div className="font-bold text-xs text-white mb-2">Current Data (Debug)</div>
            <pre className="text-xs overflow-auto text-white">{JSON.stringify(formData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
} 
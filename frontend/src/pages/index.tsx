import { useState } from 'react'
import { useDataStore } from '../store/dataStore'
import UploadPanel from '../components/UploadPanel'

export default function Home() {
  const [showUpload, setShowUpload] = useState(false)
  const { currentProject, pendingProject, setProject, applyProject, cancelProjectChange, clearProjectData } = useDataStore()
  const [isApplying, setIsApplying] = useState(false)
  const [showClearConfirm1, setShowClearConfirm1] = useState(false)
  const [showClearConfirm2, setShowClearConfirm2] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const displayProject = pendingProject !== null ? pendingProject : currentProject
  const hasChanges = pendingProject !== null && pendingProject !== currentProject

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await applyProject()
    } finally {
      setIsApplying(false)
    }
  }

  const handleClearData = async () => {
    setIsClearing(true)
    try {
      await clearProjectData()
      setShowClearConfirm2(false)
      setShowClearConfirm1(false)
      alert('Project data cleared successfully!')
    } catch (error: any) {
      alert(`Error clearing data: ${error?.message || String(error)}`)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">Quest Designer</h1>
            <p className="text-xl text-slate-300">Visual NPC and Quest Graph Editor</p>
            <div className="flex items-center gap-2 mt-4">
              <label className="text-sm text-slate-400">Current Project:</label>
              <input
                type="text"
                value={displayProject}
                onChange={(e) => setProject(e.target.value)}
                placeholder="default"
                className="px-3 py-2 bg-slate-800 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
              {hasChanges && (
                <>
                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold rounded transition"
                  >
                    {isApplying ? 'Applying...' : 'Apply'}
                  </button>
                  <button
                    onClick={cancelProjectChange}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 4m0 0l-3-4m3 4V3" />
              </svg>
              Import/Export
            </button>
            <button
              onClick={() => setShowClearConfirm1(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Project Data
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="/editor/npcs" className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition transform hover:scale-105">
            <h2 className="text-3xl font-bold text-white mb-2">NPC Editor</h2>
            <p className="text-slate-200">Create and edit NPC conversations with visual option trees</p>
          </a>

          <a href="/editor/quests" className="p-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg hover:from-purple-500 hover:to-purple-600 transition transform hover:scale-105">
            <h2 className="text-3xl font-bold text-white mb-2">Quest Editor</h2>
            <p className="text-slate-200">Design quest chains and objectives with AND/OR logic</p>
          </a>
        </div>
      </div>

      {showUpload && <UploadPanel onClose={() => setShowUpload(false)} />}

      {/* First Confirmation Dialog */}
      {showClearConfirm1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-red-500 mb-4">⚠️ Warning</h3>
            <p className="text-white mb-6">
              Are you sure you want to clear ALL data for project "<span className="font-bold text-yellow-400">{displayProject}</span>"?
            </p>
            <p className="text-slate-400 mb-6">
              This will delete all NPCs and Missions permanently. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm1(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowClearConfirm1(false)
                  setShowClearConfirm2(true)
                }}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second Confirmation Dialog */}
      {showClearConfirm2 && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 border-4 border-red-600">
            <h3 className="text-2xl font-bold text-red-500 mb-4">🚨 FINAL WARNING</h3>
            <p className="text-white mb-4 text-lg font-bold">
              This is your LAST chance!
            </p>
            <p className="text-slate-300 mb-6">
              Clicking "DELETE EVERYTHING" will permanently remove all data for project "<span className="font-bold text-yellow-400">{displayProject}</span>".
            </p>
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-4 mb-6">
              <p className="text-red-300 text-sm">
                ⚠️ All NPCs, Missions, dialog trees, and quest data will be lost forever.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm2(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded transition"
              >
                Cancel (Safe)
              </button>
              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-bold rounded transition"
              >
                {isClearing ? 'Deleting...' : 'DELETE EVERYTHING'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useDataStore } from '@/store/dataStore'
import FileSelector from '@/components/FileSelector'
import QuestEditor from '@/components/QuestEditor'

export default function QuestsPage() {
  const router = useRouter()
  const { currentFile, currentData, currentProject, pendingProject, setProject, applyProject, cancelProjectChange, loading, error, loadFiles } = useDataStore()
  const [isApplying, setIsApplying] = useState(false)

  const displayProject = pendingProject !== null ? pendingProject : currentProject
  const hasChanges = pendingProject !== null && pendingProject !== currentProject
  
  // Check if data has missions
  const hasValidData = currentData && currentData.missions

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await applyProject()
    } finally {
      setIsApplying(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-400">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded transition flex items-center gap-2"
                title="Home"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </button>
              <h1 className="text-3xl font-bold">Mission Editor</h1>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Project:</label>
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
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => router.push('/editor/npcs')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
              >
                ← NPC Editor
              </button>
            </div>
          </div>
          <FileSelector type="missions" />
        </div>

        {/* Content */}
        <div className="p-6">
          {!currentFile ? (
            <div className="text-slate-400">Select or create a mission file to start editing</div>
          ) : !hasValidData ? (
            <div className="text-slate-400">Selected file does not contain mission data</div>
          ) : (
            <QuestEditor />
          )}
        </div>
      </div>
    </div>
  )
}


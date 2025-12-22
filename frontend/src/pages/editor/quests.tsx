import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDataStore } from '@/store/dataStore'
import FileSelector from '@/components/FileSelector'
import QuestEditor from '@/components/QuestEditor'

export default function QuestsPage() {
  const router = useRouter()
  const { currentFile, currentData, loading, error, loadFiles } = useDataStore()

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
            <h1 className="text-3xl font-bold">Quest Editor</h1>
            <button
              onClick={() => router.push('/editor/npcs')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
            >
              ← NPC Editor
            </button>
          </div>
          <FileSelector type="quests" />
        </div>

        {/* Content */}
        <div className="p-6">
          {!currentFile ? (
            <div className="text-slate-400">Select or create a quest file to start editing</div>
          ) : !currentData?.quests ? (
            <div className="text-slate-400">Selected file does not contain quest data</div>
          ) : (
            <QuestEditor />
          )}
        </div>
      </div>
    </div>
  )
}


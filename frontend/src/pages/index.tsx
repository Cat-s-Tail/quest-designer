import { useState } from 'react'
import { useDataStore } from '../store/dataStore'
import UploadPanel from '../components/UploadPanel'

export default function Home() {
  const [showUpload, setShowUpload] = useState(false)
  const { currentProject, setProject } = useDataStore()

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
                value={currentProject}
                onChange={(e) => setProject(e.target.value)}
                placeholder="default"
                className="px-3 py-2 bg-slate-800 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition transform hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 4m0 0l-3-4m3 4V3" />
            </svg>
            Import/Export Data
          </button>
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
    </div>
  )
}


import { useState } from 'react'
import { useDataStore } from '@/store/dataStore'

export default function FileSelector({ type = 'npcs' }: { type?: 'npcs' | 'quests' }) {
  const { files, currentFile, loadFile, createFile, deleteFile } = useDataStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const handleCreate = async () => {
    if (!newFileName.trim()) return

    try {
      const path = `${type}/${newFileName}.json`
      await createFile(path, type)
      setNewFileName('')
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create file:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
        >
          + New {type === 'npcs' ? 'NPC' : 'Quest'} File
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 text-slate-300">
          {type === 'npcs' ? 'NPCs' : 'Quests'}
        </h3>
        <div className="space-y-1">
          {files[type]?.length > 0 ? (
            files[type].map((file: string) => (
              <div
                key={file}
                onClick={() => loadFile(file)}
                className={`p-2 rounded cursor-pointer transition ${
                  currentFile === file
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate">{file}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteFile(file)
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm">No {type} files</p>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create New {type === 'npcs' ? 'NPC' : 'Quest'} File</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">File Name</label>
                <input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder={type === 'npcs' ? 'e.g., merchants, guards' : 'e.g., main_quests, side_quests'}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


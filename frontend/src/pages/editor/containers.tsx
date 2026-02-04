import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ContainerEditor from '@/components/ContainerEditor'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function ContainersPage() {
  const router = useRouter()
  const [currentProject, _setCurrentProject] = useState('default')
  const [currentFile, setCurrentFile] = useState('')
  const [files, setFiles] = useState<any[]>([])
  const [containers, setContainers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  // Load files on mount
  useEffect(() => {
    loadFiles()
  }, [currentProject])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/containers/files?project=${currentProject}`)
      const data = await res.json()
      setFiles(data.files || [])
      
      if (data.files && data.files.length > 0) {
        // Load first file
        await loadFile(data.files[0].filename)
      }
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFile = async (filename: string) => {
    try {
      const res = await fetch(`${API_URL}/api/containers/files/${filename}?project=${currentProject}`)
      const data = await res.json()
      setCurrentFile(filename)
      setContainers(data.containers || [])
    } catch (error) {
      console.error('Error loading file:', error)
      setContainers([])
    }
  }

  const saveFile = async () => {
    try {
      await fetch(`${API_URL}/api/containers/files?project=${currentProject}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: currentFile || 'containers.json',
          containers
        })
      })
    } catch (error) {
      console.error('Error saving file:', error)
      throw error
    }
  }

  const updateContainer = (containerId: string, updates: any) => {
    setContainers(prev => prev.map(container => 
      container.id === containerId ? { ...container, ...updates } : container
    ))
  }

  const addContainer = (newContainer: any) => {
    setContainers(prev => [...prev, newContainer])
  }

  const deleteContainer = (containerId: string) => {
    setContainers(prev => prev.filter(container => container.id !== containerId))
  }

  const generateGUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const createNewFile = async () => {
    if (!newFileName.trim()) return
    
    const filename = newFileName.endsWith('.json') ? newFileName : `${newFileName}.json`
    
    try {
      await fetch(`${API_URL}/api/containers/files?project=${currentProject}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          containers: []
        })
      })
      
      await loadFiles()
      setCurrentFile(filename)
      setContainers([])
      setShowNewFileDialog(false)
      setNewFileName('')
    } catch (error) {
      console.error('Error creating file:', error)
      alert('Failed to create file')
    }
  }

  const deleteCurrentFile = async () => {
    if (!currentFile) return
    if (!confirm(`Delete file "${currentFile}"? This cannot be undone.`)) return
    
    try {
      await fetch(`${API_URL}/api/containers/files/${currentFile}?project=${currentProject}`, {
        method: 'DELETE'
      })
      
      await loadFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-fuchsia-400">Container Editor</h1>
          <select
            value={currentFile}
            onChange={(e) => loadFile(e.target.value)}
            className="px-3 py-2 bg-slate-700 rounded"
          >
            {files.map(file => (
              <option key={file.filename} value={file.filename}>
                {file.filename}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewFileDialog(true)}
            className="px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded text-sm"
          >
            + New File
          </button>
          {currentFile && (
            <button
              onClick={deleteCurrentFile}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Delete File
            </button>
          )}
        </div>
        <div className="text-sm text-slate-400">
          Project: {currentProject}
        </div>
      </div>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-fuchsia-400 mb-4">Create New Container File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNewFile()}
              placeholder="containers_special.json"
              className="w-full px-3 py-2 bg-slate-700 text-white rounded mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewFileDialog(false)
                  setNewFileName('')
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={createNewFile}
                disabled={!newFileName.trim()}
                className="flex-1 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-600 text-white rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <ContainerEditor
        containers={containers}
        onUpdate={updateContainer}
        onAdd={addContainer}
        onDelete={deleteContainer}
        onSave={saveFile}
        generateGUID={generateGUID}
      />
    </div>
  )
}

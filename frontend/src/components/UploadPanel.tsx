import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useDataStore } from '@/store/dataStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function UploadPanel({ onClose }: { onClose: () => void }) {
  const { currentProject } = useDataStore()
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  const [stats, setStats] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState('npcs')

  useEffect(() => {
    loadStats()
  }, [currentProject])

  const loadStats = async () => {
    try {
      const [uploadStats, itemFilesRes, containerFilesRes] = await Promise.all([
        axios.get(`${API_URL}/api/upload/stats`, { params: { project: currentProject } }),
        axios.get(`${API_URL}/api/items/files`, { params: { project: currentProject } }),
        axios.get(`${API_URL}/api/containers/files`, { params: { project: currentProject } })
      ])
      
      const itemFiles = itemFilesRes.data.files || []
      const containerFiles = containerFilesRes.data.files || []
      const totalItems = itemFiles.reduce((sum: number, f: any) => sum + (f.items?.length || 0), 0)
      const totalContainers = containerFiles.reduce((sum: number, f: any) => sum + (f.containers?.length || 0), 0)
      
      setStats({
        ...uploadStats.data,
        items: totalItems,
        containers: totalContainers,
        itemFiles: itemFiles.length,
        containerFiles: containerFiles.length
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  React.useEffect(() => {
    loadStats()
  }, [])

  const handleFileUpload = async (event: any, type: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (type === 'items' || type === 'containers') {
        // For items/containers, use new API
        const endpoint = type === 'items' ? '/api/items/files' : '/api/containers/files'
        const filename = file.name
        const payload = type === 'items' 
          ? { filename, items: data }
          : { filename, containers: data }
        
        await axios.post(`${API_URL}${endpoint}`, payload, {
          params: { project: currentProject }
        })
        
        setMessage({
          type: 'success',
          text: `Successfully uploaded ${type} file: ${filename}`
        })
      } else {
        // Original logic for NPCs/Missions
        const originalFilename = file.name
        const filename = type === 'npcs' 
          ? `npcs/${originalFilename}` 
          : `quests/${originalFilename}`
        const payload = { ...data, filename }

        const endpoint = type === 'npcs' ? '/api/upload/npcs' : '/api/upload/missions'
        const response = await axios.post(`${API_URL}${endpoint}`, payload, {
          params: { project: currentProject }
        })

        setMessage({
          type: 'success',
          text: response.data.message || `Successfully uploaded ${type}`
        })
      }

      // Reload stats
      await loadStats()

      // Reset file input
      event.target.value = ''
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({
        type: 'error',
        text: (error as any).response?.data?.error || (error as any).message || 'Failed to upload file'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleExport = async (type: string) => {
    setExporting(true)
    setMessage(null)

    try {
      let response
      let filename
      
      if (type === 'items' || type === 'containers') {
        // For items/containers, get all files and merge them
        const endpoint = type === 'items' ? '/api/items/files' : '/api/containers/files'
        const filesRes = await axios.get(`${API_URL}${endpoint}`, {
          params: { project: currentProject }
        })
        
        const files = filesRes.data.files || []
        const allData = type === 'items'
          ? files.flatMap((f: any) => f.items || [])
          : files.flatMap((f: any) => f.containers || [])
        
        response = { data: allData }
        filename = `${type}_${currentProject}.json`
      } else {
        const endpoint = type === 'npcs' ? '/api/upload/export/npcs' : '/api/upload/export/missions'
        response = await axios.get(`${API_URL}${endpoint}`, {
          params: { project: currentProject }
        })
        filename = `${type}_${currentProject}.json`
      }

      // Create a blob and download the file
      const jsonString = JSON.stringify(response.data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({
        type: 'success',
        text: `Successfully exported ${type} to JSON`
      })
    } catch (error) {
      console.error('Export error:', error)
      setMessage({
        type: 'error',
        text: (error as any).response?.data?.error || (error as any).message || 'Failed to export file'
      })
    } finally {
      setExporting(false)
    }
  }

  const handleExportZip = async (type: string) => {
    setExporting(true)
    setMessage(null)

    try {
      const endpoint = type === 'npcs' ? '/api/upload/export/npcs/zip' : '/api/upload/export/missions/zip'
      const response = await axios.get(`${API_URL}${endpoint}`, {
        params: { project: currentProject },
        responseType: 'blob'
      })

      // Create a blob and download the file
      const blob = new Blob([response.data], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}_${currentProject}_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setMessage({
        type: 'success',
        text: `Successfully exported ${type} to ZIP (one file per document)`
      })
    } catch (error) {
      console.error('Export ZIP error:', error)
      setMessage({
        type: 'error',
        text: (error as any).response?.data?.error || (error as any).message || 'Failed to export ZIP file'
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Import/Export Data</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={uploading || exporting}
          >
            ×
          </button>
        </div>

        {stats && (
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Project: {currentProject}</span>
              <br />
              <span className="font-semibold">{stats.npcs} NPCs</span>,{' '}
              <span className="font-semibold">{stats.missions} Missions</span>,{' '}
              <span className="font-semibold">{stats.items} Items</span>,{' '}
              <span className="font-semibold">{stats.containers} Containers</span>
            </p>
          </div>
        )}

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex mb-4 border-b">
          <button
            className={`flex-1 py-2 px-4 font-medium text-sm ${
              activeTab === 'npcs'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('npcs')}
            disabled={uploading || exporting}
          >
            NPCs
          </button>
          <button
            className={`flex-1 py-2 px-4 font-medium text-sm ${
              activeTab === 'missions'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('missions')}
            disabled={uploading || exporting}
          >
            Missions
          </button>
          <button
            className={`flex-1 py-2 px-4 font-medium text-sm ${
              activeTab === 'items'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('items')}
            disabled={uploading || exporting}
          >
            Items
          </button>
          <button
            className={`flex-1 py-2 px-4 font-medium text-sm ${
              activeTab === 'containers'
                ? 'border-b-2 border-fuchsia-500 text-fuchsia-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('containers')}
            disabled={uploading || exporting}
          >
            Containers
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 'npcs' && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Upload NPCs</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload a JSON file containing NPCs. This will replace all existing NPCs in the
                database.
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, 'npcs')}
                  disabled={uploading || exporting}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Expected format: {`{ "npcs": [...] }`}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Export NPCs</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download all NPCs from the database.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('npcs')}
                    disabled={uploading || exporting || (stats && stats.npcs === 0)}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    JSON (All)
                  </button>
                  <button
                    onClick={() => handleExportZip('npcs')}
                    disabled={uploading || exporting || (stats && stats.npcs === 0)}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ZIP (Separate)
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  JSON: All NPCs in one file. ZIP: One file per NPC.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'missions' && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Upload Missions</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload a JSON file containing missions/quests. This will replace all existing
                missions in the database.
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, 'missions')}
                  disabled={uploading || exporting}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Expected format: {`{ "quests": [...] }`} or {`{ "missions": [...] }`}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Export Missions</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download all missions from the database.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport('missions')}
                    disabled={uploading || exporting || (stats && stats.missions === 0)}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    JSON (All)
                  </button>
                  <button
                    onClick={() => handleExportZip('missions')}
                    disabled={uploading || exporting || (stats && stats.missions === 0)}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    ZIP (Separate)
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  JSON: All missions in one file. ZIP: One file per mission.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Upload Items</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload a JSON file containing item definitions (array format).
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, 'items')}
                  disabled={uploading || exporting}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-50 file:text-green-700
                    hover:file:bg-green-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Expected format: Array of item definitions {`[{...}, {...}]`}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Export Items</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download all items from the database.
                </p>
                <button
                  onClick={() => handleExport('items')}
                  disabled={uploading || exporting || (stats && stats.items === 0)}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Items JSON
                </button>
              </div>
            </div>
          )}

          {activeTab === 'containers' && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Upload Containers</h3>
              <p className="text-sm text-gray-600 mb-3">
                Upload a JSON file containing container definitions (array format).
              </p>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(e, 'containers')}
                  disabled={uploading || exporting}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-fuchsia-50 file:text-fuchsia-700
                    hover:file:bg-fuchsia-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Expected format: Array of container definitions {`[{...}, {...}]`}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Export Containers</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Download all containers from the database.
                </p>
                <button
                  onClick={() => handleExport('containers')}
                  disabled={uploading || exporting || (stats && stats.containers === 0)}
                  className="w-full py-2 px-4 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Containers JSON
                </button>
              </div>
            </div>
          )}

          {(uploading || exporting) && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            disabled={uploading || exporting}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}


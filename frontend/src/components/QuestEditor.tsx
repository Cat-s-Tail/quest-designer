import { useState, useEffect } from 'react'
import { useDataStore } from '@/store/dataStore'
import QuestTree from './QuestTree'
import Toast from './Toast'

export default function QuestEditor() {
  const { currentFile, currentData, saveFile, updateMission, addMission, deleteMission, generateGUID } = useDataStore()
  const [selectedMission, setSelectedMission] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Get missions from data
  const missions = currentData?.missions || []
  const mission = selectedMission ? missions.find((m: any) => m.id === selectedMission) : null

  // Track mouse position for paste
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Search functionality with dropdown
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = missions.filter((m: any) => 
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setSearchResults(results)
      setShowSearchDropdown(results.length > 0)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }, [searchTerm, missions])

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && mission) {
        e.preventDefault()
        // Store as JSON in localStorage
        const missionCopy = JSON.stringify(mission)
        localStorage.setItem('quest-designer-clipboard', missionCopy)
        localStorage.setItem('quest-designer-clipboard-type', 'mission')
        setToast({ message: 'Mission copied to clipboard', type: 'success' })
        setTimeout(() => setToast(null), 2000)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        const clipboardData = localStorage.getItem('quest-designer-clipboard')
        const clipboardType = localStorage.getItem('quest-designer-clipboard-type')
        
        if (clipboardData && clipboardType === 'mission') {
          const clipboard = JSON.parse(clipboardData)
          const newMission = {
            ...clipboard,
            id: generateGUID(),
            name: `${clipboard.name || clipboard.title} (Copy)`,
            // Paste at mouse position (approximate, will be adjusted in graph)
            position: { 
              x: mousePos.x - 200, 
              y: mousePos.y - 100 
            }
          }
          const updated = { ...currentData, missions: [...missions, newMission] }
          saveFile(currentFile, updated)
          setSelectedMission(newMission.id)
          setToast({ message: 'Mission pasted at cursor', type: 'success' })
          setTimeout(() => setToast(null), 2000)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mission, currentData, currentFile, missions, generateGUID, saveFile, mousePos])

  const handleAddMission = () => {
    const newMission = addMission()
    setSelectedMission(newMission.id)
  }

  const handleDeleteMission = (missionId: string) => {
    if (confirm(`Delete mission "${mission?.name || mission?.title || missionId}"?`)) {
      deleteMission(missionId)
      setSelectedMission(null)
    }
  }

  const handleSelectFromSearch = (missionId: string) => {
    setSelectedMission(missionId)
    setSearchTerm('')
    setShowSearchDropdown(false)
    // Trigger focus on the selected mission in graph
    const event = new CustomEvent('focusMission', { detail: { missionId } })
    window.dispatchEvent(event)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveFile(currentFile, currentData)
      setToast({ message: 'Saved successfully!', type: 'success' })
    } catch (error) {
      setToast({ message: `Error saving: ${error instanceof Error ? error.message : String(error)}`, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const addObjective = () => {
    if (!mission || !mission.conditions) return
    
    const newObjective = {
      objective_id: generateGUID(),
      related_event: 'CUSTOM_EVENT',
      validate: 'true',
      count: 0,
      requirement: 1,
      description: 'New Objective'
    }
    
    const conditions = mission.conditions
    if (!conditions.and) conditions.and = []
    conditions.and.push(newObjective)
    
    updateMission(mission.id, { conditions })
  }

  const updateObjective = (index: number, updates: any) => {
    if (!mission || !mission.conditions?.and) return
    
    const newConditions = { ...mission.conditions }
    newConditions.and[index] = { ...newConditions.and[index], ...updates }
    updateMission(mission.id, { conditions: newConditions })
  }

  const deleteObjective = (index: number) => {
    if (!mission || !mission.conditions?.and) return
    
    const newConditions = { ...mission.conditions }
    newConditions.and = newConditions.and.filter((_: any, i: number) => i !== index)
    updateMission(mission.id, { conditions: newConditions })
  }

  const addEventScript = () => {
    if (!mission) return
    const scripts = mission.onEvent || []
    updateMission(mission.id, { onEvent: [...scripts, '@mission_evaluate_standard'] })
  }

  const updateEventScript = (index: number, value: string) => {
    if (!mission) return
    const scripts = [...(mission.onEvent || [])]
    scripts[index] = value
    updateMission(mission.id, { onEvent: scripts })
  }

  const deleteEventScript = (index: number) => {
    if (!mission) return
    const scripts = (mission.onEvent || []).filter((_: any, i: number) => i !== index)
    updateMission(mission.id, { onEvent: scripts })
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1">
          <h3 className="font-bold text-lg">Missions</h3>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search missions by ID/name/category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectFromSearch(m.id)}
                    className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                  >
                    <div className="font-bold text-sm text-white">{m.name || m.title}</div>
                    <div className="text-xs text-slate-400">{m.category} • {m.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {localStorage.getItem('quest-designer-clipboard-type') === 'mission' && (
            <span className="text-xs text-slate-400">
              📋 Ctrl+V to paste at cursor
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded transition"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleAddMission}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
          >
            + New Mission
          </button>
        </div>
      </div>

      {/* Mission Graph and Detail Editor */}
      <div className="flex gap-4">
        {/* Mission Graph - Left */}
        <div className="flex-[2] bg-slate-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <QuestTree
            quests={missions}
            selectedQuest={selectedMission}
            onSelectQuest={setSelectedMission}
            onAddQuest={handleAddMission}
            onRelink={(sourceId: string, targetId: string, isBreaking?: boolean) => {
              const sourceMission = missions.find((m: any) => m.id === sourceId)
              if (sourceMission) {
                if (isBreaking) {
                  // Remove unlock
                  const unlocks = (sourceMission.unlocks || []).filter((id: string) => id !== targetId)
                  updateMission(sourceId, { unlocks })
                } else {
                  // Add unlock
                  const unlocks = [...(sourceMission.unlocks || [])]
                  if (!unlocks.includes(targetId)) {
                    unlocks.push(targetId)
                    updateMission(sourceId, { unlocks })
                  }
                }
              }
            }}
            onUpdatePosition={(missionId: string, position: any) => {
              updateMission(missionId, { position })
            }}
          />
        </div>

        {/* Detail Editor - Right */}
        <div className="flex-[1] bg-slate-800 rounded-lg p-4 space-y-4 overflow-y-auto" style={{ height: '600px' }}>
          {!mission ? (
            <div className="text-slate-400 text-center mt-10">
              Select a mission to edit
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h4 className="font-bold text-slate-300">Edit Mission</h4>
                <button
                  onClick={() => handleDeleteMission(mission.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Delete
                </button>
              </div>

            {/* ID */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">ID (Read-only)</label>
              <input
                value={mission.id}
                disabled
                className="w-full px-3 py-2 bg-slate-600 text-slate-400 rounded text-sm font-mono cursor-not-allowed"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name</label>
              <input
                value={mission.name || mission.title || ''}
                onChange={(e) => updateMission(mission.id, { name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea
                value={mission.description || ''}
                onChange={(e) => updateMission(mission.id, { description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded h-20"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <input
                value={mission.category || ''}
                onChange={(e) => updateMission(mission.id, { category: e.target.value })}
                placeholder="e.g., combat, gathering, story"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded"
              />
            </div>

            {/* Can Unlock - Lua Expression */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Can Unlock (Lua Expression)
              </label>
              <textarea
                value={mission.canUnlock || 'true'}
                onChange={(e) => updateMission(mission.id, { canUnlock: e.target.value })}
                placeholder="var.level >= 5"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded font-mono text-sm h-16"
              />
              <div className="text-xs text-slate-500 mt-1">
                Lua expression that returns true/false to determine if mission can be unlocked
              </div>
            </div>

            {/* Conditions - JSON Logical Expression */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Conditions / Objectives ({mission.conditions?.and?.length || 0})
              </label>
              <div className="text-xs text-slate-500 mb-2">
                Logical expression defining mission objectives (and/or/not structure)
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(mission.conditions?.and || []).map((obj: any, idx: number) => (
                  <div key={idx} className="bg-slate-700 rounded p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-300">Objective {idx + 1}</span>
                      <button
                        onClick={() => deleteObjective(idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕ Delete
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Objective ID</label>
                        <input
                          value={obj.objective_id || ''}
                          onChange={(e) => updateObjective(idx, { objective_id: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Related Event</label>
                        <input
                          value={obj.related_event || ''}
                          onChange={(e) => updateObjective(idx, { related_event: e.target.value })}
                          placeholder="ENEMY_KILLED"
                          className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Validate (Lua)</label>
                      <textarea
                        value={obj.validate || 'true'}
                        onChange={(e) => updateObjective(idx, { validate: e.target.value })}
                        placeholder="event.enemyType == 'goblin'"
                        className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm font-mono"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Description</label>
                      <input
                        value={obj.description || ''}
                        onChange={(e) => updateObjective(idx, { description: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Count</label>
                        <input
                          type="number"
                          value={obj.count || 0}
                          onChange={(e) => updateObjective(idx, { count: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Requirement</label>
                        <input
                          type="number"
                          value={obj.requirement || 1}
                          onChange={(e) => updateObjective(idx, { requirement: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          <input
                            type="checkbox"
                            checked={obj.reset_on_death || false}
                            onChange={(e) => updateObjective(idx, { reset_on_death: e.target.checked })}
                            className="mr-1"
                          />
                          Reset on Death
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addObjective}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm mt-2"
              >
                + Add Objective
              </button>
            </div>

            {/* OnEvent Scripts */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                OnEvent Scripts ({mission.onEvent?.length || 0})
              </label>
              <div className="text-xs text-slate-500 mb-2">
                Array of Lua scripts executed sequentially when events occur. Use @filename for references.
              </div>
              <div className="space-y-2">
                {(mission.onEvent || []).map((script: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={script}
                      onChange={(e) => updateEventScript(idx, e.target.value)}
                      placeholder="@mission_evaluate_standard"
                      className="flex-1 px-3 py-2 bg-slate-700 text-white rounded font-mono text-sm"
                    />
                    <button
                      onClick={() => deleteEventScript(idx)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addEventScript}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  + Add Script
                </button>
              </div>
            </div>

            {/* Unlocks */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Unlocks (comma-separated IDs)</label>
              <input
                value={(mission.unlocks || []).join(', ')}
                onChange={(e) => updateMission(mission.id, { 
                  unlocks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                })}
                placeholder="mission_2, mission_3"
                className="w-full px-3 py-2 bg-slate-700 text-white rounded font-mono text-sm"
              />
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

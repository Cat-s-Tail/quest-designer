import { useState, useEffect } from 'react'
import ContainerTree from './ContainerTree'
import Toast from './Toast'

export default function ContainerEditor({ containers, onUpdate, onAdd, onDelete, onSave, generateGUID }: any) {
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [getAllPositionsRef, setGetAllPositionsRef] = useState<(() => Map<string, { x: number; y: number }>) | null>(null)

  const container = selectedContainer ? containers.find((c: any) => c.id === selectedContainer) : null

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = containers.filter((c: any) => 
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setSearchResults(results)
      setShowSearchDropdown(results.length > 0)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }, [searchTerm, containers])

  const handleAddContainer = () => {
    const newContainer = {
      id: generateGUID(),
      name: 'New Container',
      description: '',
      icon: '',
      maxWeight: -1,
      containerPanelPrefabKey: '',
      sections: [],
      next: [],
      position: { x: 0, y: 0 }
    }
    onAdd(newContainer)
    setSelectedContainer(newContainer.id)
  }

  const handleDeleteContainer = () => {
    if (!container) return
    if (confirm(`Delete container "${container.name || container.id}"?`)) {
      onDelete(container.id)
      setSelectedContainer(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 保存前从 Tree 获取所有节点的当前位置
      if (getAllPositionsRef && typeof getAllPositionsRef === 'function') {
        const allPositions = getAllPositionsRef()
        allPositions.forEach((position, containerId) => {
          const container = containers.find((c: any) => c.id === containerId)
          // 只有当位置不同时才更新
          if (container && (container.position?.x !== position.x || container.position?.y !== position.y)) {
            onUpdate(containerId, { position })
          }
        })
      }
      
      // 等待一小段时间确保状态更新
      await new Promise(resolve => setTimeout(resolve, 50))
      
      await onSave()
      setToast({ message: 'Saved successfully!', type: 'success' })
      setTimeout(() => setToast(null), 2000)
    } catch (error) {
      setToast({ message: `Error saving: ${error instanceof Error ? error.message : String(error)}`, type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSelectFromSearch = (containerId: string) => {
    setSelectedContainer(containerId)
    setSearchTerm('')
    setShowSearchDropdown(false)
  }

  const handleRelink = (sourceId: string, targetId: string) => {
    const sourceContainer = containers.find((c: any) => c.id === sourceId)
    if (!sourceContainer) return
    
    const next = sourceContainer.next || []
    if (!next.includes(targetId)) {
      onUpdate(sourceId, { next: [...next, targetId] })
    }
  }

  const handleUpdatePosition = (containerId: string, position: { x: number; y: number }) => {
    // 立即更新到数据中
    onUpdate(containerId, { position })
  }

  const addSection = () => {
    if (!container) return
    const sections = container.sections || []
    const newSection = {
      sectionID: `section_${sections.length + 1}`,
      name: 'New Section',
      type: 'Grid',
      gridWidth: 10,
      gridHeight: 10,
      allowedItemTypes: [],
      breakLineAfter: false,
      layoutOffset: [0, 0]
    }
    onUpdate(container.id, { sections: [...sections, newSection] })
  }

  const updateSection = (index: number, updates: any) => {
    if (!container) return
    const sections = [...(container.sections || [])]
    sections[index] = { ...sections[index], ...updates }
    onUpdate(container.id, { sections })
  }

  const deleteSection = (index: number) => {
    if (!container) return
    const sections = (container.sections || []).filter((_: any, i: number) => i !== index)
    onUpdate(container.id, { sections })
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 flex-1">
          <h3 className="font-bold text-lg text-fuchsia-400">Containers</h3>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search containers by ID/name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.map((c: any) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectFromSearch(c.id)}
                    className="px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700"
                  >
                    <div className="font-semibold text-sm">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddContainer} className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded">
            Add Container
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Left: Graph */}
        <div className="bg-slate-800 rounded overflow-hidden">
          <ContainerTree
            containers={containers}
            selectedContainer={selectedContainer}
            onSelectContainer={setSelectedContainer}
            onAddContainer={handleAddContainer}
            onRelink={handleRelink}
            onUpdatePosition={handleUpdatePosition}
            onGetAllPositions={setGetAllPositionsRef}
          />
        </div>

        {/* Right: Editor */}
        <div className="bg-slate-800 rounded p-4 overflow-y-auto">
          {container ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-fuchsia-400">Edit Container</h4>
                <button onClick={handleDeleteContainer} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                  Delete
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">ID</label>
                <input
                  type="text"
                  value={container.id}
                  onChange={(e) => onUpdate(container.id, { id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={container.name}
                  onChange={(e) => onUpdate(container.id, { name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  value={container.description}
                  onChange={(e) => onUpdate(container.id, { description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Max Weight (-1 = unlimited)</label>
                <input
                  type="number"
                  value={container.maxWeight}
                  onChange={(e) => onUpdate(container.id, { maxWeight: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                />
              </div>

              {/* Sections */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold">Sections</label>
                  <button onClick={addSection} className="px-2 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded text-xs">
                    Add Section
                  </button>
                </div>
                <div className="space-y-2">
                  {(container.sections || []).map((section: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-700 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={section.sectionID}
                          onChange={(e) => updateSection(idx, { sectionID: e.target.value })}
                          className="flex-1 px-2 py-1 bg-slate-600 text-white rounded text-xs font-semibold"
                          placeholder="Section ID"
                        />
                        <button onClick={() => deleteSection(idx)} className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">
                          ×
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        value={section.name || ''}
                        onChange={(e) => updateSection(idx, { name: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-600 text-white rounded text-xs mb-1"
                        placeholder="Section display name"
                      />
                      
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(idx, { type: e.target.value })}
                        className="w-full px-2 py-1 bg-slate-600 text-white rounded text-xs mb-1"
                      >
                        <option value="Grid">Grid</option>
                        <option value="SingleHorizontal">Single Horizontal</option>
                        <option value="SingleVertical">Single Vertical</option>
                      </select>
                      
                      {section.type === 'Grid' && (
                        <div className="grid grid-cols-2 gap-1 mb-1">
                          <input
                            type="number"
                            value={section.gridWidth || 10}
                            onChange={(e) => updateSection(idx, { gridWidth: parseInt(e.target.value) })}
                            className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
                            placeholder="Width"
                          />
                          <input
                            type="number"
                            value={section.gridHeight || 10}
                            onChange={(e) => updateSection(idx, { gridHeight: parseInt(e.target.value) })}
                            className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
                            placeholder="Height"
                          />
                        </div>
                      )}
                      
                      <textarea
                        value={(section.allowedItemTypes || []).join(', ')}
                        onChange={(e) => updateSection(idx, { 
                          allowedItemTypes: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                        })}
                        className="w-full px-2 py-1 bg-slate-600 text-white rounded text-xs mb-1"
                        rows={1}
                        placeholder="Allowed item types (comma-separated, e.g., weapon, tool)"
                      />
                      
                      <div className="flex items-center gap-2 mb-1">
                        <label className="flex items-center gap-1 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={section.breakLineAfter || false}
                            onChange={(e) => updateSection(idx, { breakLineAfter: e.target.checked })}
                            className="rounded"
                          />
                          Break line after
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="number"
                          value={section.layoutOffset?.[0] || 0}
                          onChange={(e) => updateSection(idx, { 
                            layoutOffset: [parseFloat(e.target.value), section.layoutOffset?.[1] || 0]
                          })}
                          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
                          placeholder="Offset X"
                        />
                        <input
                          type="number"
                          value={section.layoutOffset?.[1] || 0}
                          onChange={(e) => updateSection(idx, { 
                            layoutOffset: [section.layoutOffset?.[0] || 0, parseFloat(e.target.value)]
                          })}
                          className="px-2 py-1 bg-slate-600 text-white rounded text-xs"
                          placeholder="Offset Y"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 mt-20">
              Select a container from the graph to edit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

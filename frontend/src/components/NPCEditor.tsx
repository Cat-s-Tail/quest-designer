import { useState, useEffect } from 'react'
import { useDataStore } from '@/store/dataStore'
import NPCTree from './NPCTree'
import LuaEditor from './LuaEditor'
import Toast from './Toast'

export default function NPCEditor() {
  const { currentFile, currentData, saveFile, updateNPC, addNPC, generateGUID } = useDataStore()
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const npc = selectedNPC && currentData?.npcs ? currentData.npcs.find((n: any) => n.id === selectedNPC) : null
  const node = selectedNode && npc?.nodes ? npc.nodes.find((n: any) => n.id === selectedNode) : null

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Search functionality - search NPCs and nodes
  useEffect(() => {
    if (searchTerm.trim()) {
      const results: any[] = []
      
      currentData?.npcs?.forEach((n: any) => {
        // Search NPC itself
        if (n.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (n.name || '').toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({ type: 'npc', data: n })
        }
        
        // Search nodes within NPC
        n.nodes?.forEach((node: any) => {
          if (node.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (node.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
              (node.code || '').toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({ type: 'node', npc: n, data: node })
          }
        })
      })
      
      setSearchResults(results)
      setShowSearchDropdown(results.length > 0)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }, [searchTerm, currentData])

  // Keyboard shortcuts for copy/paste nodes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && node) {
        e.preventDefault()
        // Store as JSON in localStorage
        const nodeCopy = JSON.stringify(node)
        localStorage.setItem('quest-designer-clipboard', nodeCopy)
        localStorage.setItem('quest-designer-clipboard-type', 'node')
        setToast({ message: 'Node copied to clipboard', type: 'success' })
        setTimeout(() => setToast(null), 2000)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && npc) {
        e.preventDefault()
        const clipboardData = localStorage.getItem('quest-designer-clipboard')
        const clipboardType = localStorage.getItem('quest-designer-clipboard-type')
        
        if (clipboardData && clipboardType === 'node') {
          const clipboard = JSON.parse(clipboardData)
          const newNode = {
            ...clipboard,
            id: generateGUID(),
            next: [],
            // Paste at mouse position (approximate)
            position: { 
              x: mousePos.x - 100, 
              y: mousePos.y - 50 
            }
          }
          const updatedNodes = [...(npc.nodes || []), newNode]
          updateNPC(npc.id, { nodes: updatedNodes })
          setSelectedNode(newNode.id)
          setToast({ message: 'Node pasted at cursor', type: 'success' })
          setTimeout(() => setToast(null), 2000)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [node, npc, generateGUID, updateNPC, mousePos])

  const handleAddNPC = () => {
    const newNPC = addNPC()
    setSelectedNPC(newNPC.id)
  }

  const handleSelectFromSearch = (result: any) => {
    if (result.type === 'npc') {
      setSelectedNPC(result.data.id)
      setSelectedNode(null)
    } else if (result.type === 'node') {
      setSelectedNPC(result.npc.id)
      setSelectedNode(result.data.id)
      // Trigger focus on the node in graph
      const event = new CustomEvent('focusNode', { detail: { nodeId: result.data.id } })
      window.dispatchEvent(event)
    }
    setSearchTerm('')
    setShowSearchDropdown(false)
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

  const handleAddNode = (type: string = 'dialog') => {
    if (!npc) return
    
    const newNode: any = {
      id: generateGUID(),
      type,
      text: '',
      next: [],
      position: { x: 0, y: 0 }  // Will be auto-laid out
    }
    
    if (type === 'option') {
      newNode.canShow = 'true'
    } else if (type === 'dialog') {
      newNode.speaker = npc.name
    } else if (type === 'instruction') {
      newNode.code = ''
    }
    
    const updatedNodes = [...(npc.nodes || []), newNode]
    updateNPC(npc.id, { nodes: updatedNodes })
    setSelectedNode(newNode.id)
  }

  const updateNode = (nodeId: string, updates: any) => {
    if (!npc) return
    console.log('[NPCEditor] Updating node:', nodeId, updates)
    const updatedNodes = (npc.nodes || []).map((n: any) =>
      n.id === nodeId ? { ...n, ...updates } : n
    )
    updateNPC(npc.id, { nodes: updatedNodes })
  }

  const deleteNode = (nodeId: string) => {
    if (!npc) return
    if (!confirm(`Delete node "${nodeId}"?`)) return
    
    const updatedNodes = (npc.nodes || []).filter((n: any) => n.id !== nodeId)
    
    // Clean up references
    const cleanedNodes = updatedNodes.map((n: any) => ({
      ...n,
      next: (n.next || []).filter((id: string) => id !== nodeId)
    }))
    
    const cleanedEntryNodes = (npc.entryNodes || []).filter((id: string) => id !== nodeId)
    
    updateNPC(npc.id, { nodes: cleanedNodes, entryNodes: cleanedEntryNodes })
    setSelectedNode(null)
  }

  const addEntryNode = () => {
    if (!npc) return
    const entryNodes = [...(npc.entryNodes || []), '']
    updateNPC(npc.id, { entryNodes })
  }

  const updateEntryNode = (index: number, value: string) => {
    if (!npc) return
    const entryNodes = [...(npc.entryNodes || [])]
    entryNodes[index] = value
    updateNPC(npc.id, { entryNodes })
  }

  const deleteEntryNode = (index: number) => {
    if (!npc) return
    const entryNodes = (npc.entryNodes || []).filter((_: any, i: number) => i !== index)
    updateNPC(npc.id, { entryNodes })
  }

  const addNextNode = () => {
    if (!node) return
    const next = [...(node.next || []), '']
    updateNode(node.id, { next })
  }

  const updateNextNode = (index: number, value: string) => {
    if (!node) return
    const next = [...(node.next || [])]
    next[index] = value
    updateNode(node.id, { next })
  }

  const deleteNextNode = (index: number) => {
    if (!node) return
    const next = (node.next || []).filter((_: any, i: number) => i !== index)
    updateNode(node.id, { next })
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
          <h3 className="font-bold text-lg">NPCs</h3>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search NPCs or nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-slate-800 border border-slate-600 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectFromSearch(result)}
                    className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                  >
                    {result.type === 'npc' ? (
                      <>
                        <div className="font-bold text-sm text-white">{result.data.name}</div>
                        <div className="text-xs text-slate-400">NPC • {result.data.id}</div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-sm text-white">[{result.data.type}] {result.data.text?.substring(0, 30) || result.data.id}</div>
                        <div className="text-xs text-slate-400">in {result.npc.name} • {result.data.id}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {localStorage.getItem('quest-designer-clipboard-type') === 'node' && (
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
            onClick={handleAddNPC}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
          >
            + New NPC
          </button>
        </div>
      </div>

      {/* NPC List - Top */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex gap-2 overflow-x-auto">
          {(currentData?.npcs || []).map((n: any) => (
            <div
              key={n.id}
              onClick={() => setSelectedNPC(n.id)}
              className={`px-4 py-2 rounded cursor-pointer whitespace-nowrap transition ${
                selectedNPC === n.id ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {n.name || n.id}
            </div>
          ))}
        </div>
      </div>

      {/* Tree and Detail Editor */}
      <div className="flex gap-4">
        {/* Tree View - Left */}
        <div className="flex-[2] bg-slate-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
          {npc ? (
            <NPCTree
              npc={npc}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onAddNode={handleAddNode}
              onRelink={(sourceId: string, targetId: string) => {
                // Add targetId to source's next array
                const sourceNode = npc.nodes?.find((n: any) => n.id === sourceId)
                if (sourceNode) {
                  const next = [...(sourceNode.next || [])]
                  if (!next.includes(targetId)) {
                    next.push(targetId)
                    updateNode(sourceId, { next })
                  }
                }
              }}
              onBreakLink={(sourceId: string, targetId: string) => {
                // Remove targetId from source's next array
                const sourceNode = npc.nodes?.find((n: any) => n.id === sourceId)
                if (sourceNode) {
                  const next = (sourceNode.next || []).filter((id: string) => id !== targetId)
                  updateNode(sourceId, { next })
                }
              }}
              onUpdatePosition={(nodeId: string, position: any) => {
                console.log('[NPCEditor] onUpdatePosition called:', nodeId, position)
                updateNode(nodeId, { position })
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select an NPC to view dialog tree
            </div>
          )}
        </div>

        {/* Detail Editor - Right */}
        <div className="flex-[1] bg-slate-800 rounded-lg p-4 space-y-4 overflow-y-auto" style={{ height: '600px' }}>
          {!selectedNode && npc ? (
            // NPC Root Editor
            <div className="space-y-4">
              <h4 className="font-bold text-slate-300 border-b border-slate-700 pb-2">Edit NPC</h4>
              
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID (Read-only)</label>
                <input
                  value={npc.id}
                  disabled
                  className="w-full px-3 py-2 bg-slate-600 text-slate-400 rounded text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Name</label>
                <input
                  value={npc.name || ''}
                  onChange={(e) => updateNPC(npc.id, { name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <textarea
                  value={npc.description || ''}
                  onChange={(e) => updateNPC(npc.id, { description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm h-24"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Avatar Path</label>
                <input
                  value={npc.avatar || ''}
                  onChange={(e) => updateNPC(npc.id, { avatar: e.target.value })}
                  placeholder="avatars/npc_name"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Entry Nodes ({npc.entryNodes?.length || 0})
                </label>
                <div className="text-xs text-slate-400 mb-2">
                  Array of option node IDs shown when interaction starts
                </div>
                <div className="space-y-2">
                  {(npc.entryNodes || []).map((nodeId: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={nodeId}
                        onChange={(e) => updateEntryNode(idx, e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-700 text-white rounded text-sm"
                      >
                        <option value="">-- Select Node --</option>
                        {(npc.nodes || [])
                          .filter((n: any) => n.type === 'option')
                          .map((n: any) => (
                            <option key={n.id} value={n.id}>
                              {n.text || n.id}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => deleteEntryNode(idx)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addEntryNode}
                    className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                  >
                    + Add Entry Node
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Add New Node
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddNode('option')}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                  >
                    + Option
                  </button>
                  <button
                    onClick={() => handleAddNode('dialog')}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    + Dialog
                  </button>
                  <button
                    onClick={() => handleAddNode('instruction')}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-sm"
                  >
                    + Instruction
                  </button>
                  <button
                    onClick={() => handleAddNode('exit')}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded text-sm"
                  >
                    + Exit
                  </button>
                </div>
              </div>
            </div>
          ) : node ? (
            // Node Editor
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h4 className="font-bold text-slate-300">
                  Edit {node.type} Node
                </h4>
                <button
                  onClick={() => deleteNode(node.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Delete
                </button>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Node ID (Read-only)</label>
                <input
                  value={node.id}
                  disabled
                  className="w-full px-3 py-2 bg-slate-600 text-slate-400 rounded text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Type</label>
                <select
                  value={node.type || 'dialog'}
                  onChange={(e) => updateNode(node.id, { type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                >
                  <option value="option">Option</option>
                  <option value="dialog">Dialog</option>
                  <option value="instruction">Instruction</option>
                  <option value="exit">Exit</option>
                </select>
              </div>

              {/* Common: Text field (for option and dialog) */}
              {(node.type === 'option' || node.type === 'dialog') && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Text</label>
                  <textarea
                    value={node.text || ''}
                    onChange={(e) => updateNode(node.id, { text: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                    rows={3}
                  />
                </div>
              )}

              {/* Option: canShow */}
              {node.type === 'option' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Can Show (Lua Expression)
                  </label>
                  <LuaEditor
                    value={node.canShow || 'true'}
                    onChange={(value) => updateNode(node.id, { canShow: value })}
                    height="100px"
                  />
                </div>
              )}

              {/* Dialog: speaker */}
              {node.type === 'dialog' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Speaker</label>
                  <input
                    value={node.speaker || ''}
                    onChange={(e) => updateNode(node.id, { speaker: e.target.value })}
                    placeholder="NPC Name"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
              )}

              {/* Instruction: code */}
              {node.type === 'instruction' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Code (Lua) - can use @filename
                  </label>
                  <LuaEditor
                    value={node.code || ''}
                    onChange={(value) => updateNode(node.id, { code: value })}
                    height="200px"
                  />
                </div>
              )}

              {/* Next nodes (except exit) */}
              {node.type !== 'exit' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Next Nodes ({node.next?.length || 0})
                  </label>
                  <div className="text-xs text-slate-400 mb-2">
                    Array of node IDs to navigate to (for parallel paths or choices)
                  </div>
                  <div className="space-y-2">
                    {(node.next || []).map((nextId: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <select
                          value={nextId}
                          onChange={(e) => updateNextNode(idx, e.target.value)}
                          className="flex-1 px-2 py-1 bg-slate-700 text-white rounded text-sm"
                        >
                          <option value="">-- Select Node --</option>
                          {(npc.nodes || []).map((n: any) => (
                            <option key={n.id} value={n.id}>
                              [{n.type}] {n.text || n.id}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => deleteNextNode(idx)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addNextNode}
                      className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                    >
                      + Add Next Node
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-center mt-10">
              Select an NPC or node to edit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

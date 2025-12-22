import { useState, useEffect } from 'react'
import { useDataStore } from '@/store/dataStore'
import NPCTree from './NPCTree'
import HighlightedCondition from './HighlightedCondition'
import Toast from './Toast'

export default function NPCEditor() {
  const { currentFile, currentData, saveFile, updateNPC, addNPC } = useDataStore()
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<{ nodeId: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Reset selectedOption when NPC changes
  useEffect(() => {
    setSelectedOption(null)
  }, [selectedNPC])

  const handleAddNPC = () => {
    const npc = addNPC()
    setSelectedNPC(npc.id)
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

  const npc = selectedNPC && currentData?.npcs ? currentData.npcs.find((n: any) => n.id === selectedNPC) : null

  // Helper to get node by ID
  const getNodeById = (nodeId: string) => {
    if (!nodeId || nodeId === 'root') return null
    return npc?.nodes?.find((n: any) => n.id === nodeId) || null
  }

  // Helper to update node by ID
  const updateNodeById = (nodeId: string, updates: any) => {
    if (!nodeId || nodeId === 'root' || !npc) return
    const updatedNodes = npc.nodes.map((n: any) => 
      n.id === nodeId ? { ...n, ...updates } : n
    )
    updateNPC(npc.id, { nodes: updatedNodes })
  }

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {!currentData?.npcs ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <>
          {/* NPC Selector Header */}
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">NPCs</h3>
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
              {currentData.npcs.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNPC(n.id)}
                  className={`px-4 py-2 rounded cursor-pointer whitespace-nowrap transition ${
                    selectedNPC === n.id
                      ? 'bg-blue-600'
                      : 'bg-slate-700 hover:bg-slate-600'
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
          <NPCTree
            npc={npc}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            onAddOption={() => {
              if (!npc || !npc.nodes) return
              const newNode = {
                id: `node_${Date.now()}`,
                name: 'New Node',
                type: 'dialog',
                texts: ['New dialog text'],
                next: null
              }
              const updatedNodes = [...npc.nodes, newNode]
              updateNPC(npc.id, { nodes: updatedNodes })
              setSelectedOption({ nodeId: newNode.id })
            }}
            onRelink={(sourceId: string, targetId: string) => {
              if (!npc) return
              
              // Handle root-level options
              if (sourceId.includes('-root')) {
                // This is a root option edge - we need to find which option and update its entryNode
                // For now, we'll update the first option that doesn't have an entryNode
                const updatedOptions = npc.options?.map((opt: any, idx: number) => {
                  // Find the option that should point to this target
                  // This is a simplification - in a full UI, user would select which option
                  if (idx === 0) return { ...opt, entryNode: targetId }
                  return opt
                })
                updateNPC(npc.id, { options: updatedOptions })
                return
              }

              // Check if source is options or condition node
              const sourceNode = npc.nodes?.find((n: any) => n.id === sourceId)
              
              if (sourceNode?.type === 'options') {
                // For options nodes, update the first option without entryNode
                const updatedNodes = npc.nodes.map((n: any) => {
                  if (n.id === sourceId) {
                    const updatedOptions = n.options?.map((opt: any, idx: number) => {
                      if (idx === 0 && !opt.entryNode) {
                        return { ...opt, entryNode: targetId }
                      }
                      return opt
                    })
                    return { ...n, options: updatedOptions }
                  }
                  return n
                })
                updateNPC(npc.id, { nodes: updatedNodes })
              } else if (sourceNode?.type === 'condition') {
                // For condition nodes, update the first condition without entryNode
                const updatedNodes = npc.nodes.map((n: any) => {
                  if (n.id === sourceId) {
                    const updatedConditions = n.conditions?.map((cond: any, idx: number) => {
                      if (idx === 0 && !(typeof cond === 'object' ? cond.entryNode : false)) {
                        return typeof cond === 'object' 
                          ? { ...cond, entryNode: targetId }
                          : { condition: cond, entryNode: targetId }
                      }
                      return cond
                    })
                    return { ...n, conditions: updatedConditions }
                  }
                  return n
                })
                updateNPC(npc.id, { nodes: updatedNodes })
              } else {
                // For non-options/condition nodes, update the next field
                const updatedNodes = npc.nodes.map((n: any) => 
                  n.id === sourceId ? { ...n, next: targetId } : n
                )
                updateNPC(npc.id, { nodes: updatedNodes })
              }
            }}
            onBreakLink={(fromId: string, toId: string, optionIndex?: number) => {
              if (!npc) return
              
              // Handle root-level options
              if (fromId.includes('-root')) {
                const updatedOptions = npc.options?.map((opt: any) => 
                  opt.entryNode === toId ? { ...opt, entryNode: null } : opt
                )
                updateNPC(npc.id, { options: updatedOptions })
                return
              }

              // Check if it's an options or condition node
              const sourceNode = npc.nodes?.find((n: any) => n.id === fromId)
              
              if (sourceNode?.type === 'options' && optionIndex !== undefined) {
                // Remove entryNode from specific option
                const updatedNodes = npc.nodes.map((n: any) => {
                  if (n.id === fromId) {
                    const updatedOptions = n.options?.map((opt: any, idx: number) => {
                      if (idx === optionIndex) {
                        return { ...opt, entryNode: null }
                      }
                      return opt
                    })
                    return { ...n, options: updatedOptions }
                  }
                  return n
                })
                updateNPC(npc.id, { nodes: updatedNodes })
              } else if (sourceNode?.type === 'condition' && optionIndex !== undefined) {
                // Remove entryNode from specific condition
                const updatedNodes = npc.nodes.map((n: any) => {
                  if (n.id === fromId) {
                    const updatedConditions = n.conditions?.map((cond: any, idx: number) => {
                      if (idx === optionIndex) {
                        return typeof cond === 'object' 
                          ? { ...cond, entryNode: null }
                          : { condition: cond, entryNode: null }
                      }
                      return cond
                    })
                    return { ...n, conditions: updatedConditions }
                  }
                  return n
                })
                updateNPC(npc.id, { nodes: updatedNodes })
              } else {
                // Remove next field from node
                const updatedNodes = npc.nodes.map((n: any) => {
                  if (n.id === fromId && n.next === toId) {
                    const { next, ...rest } = n
                    return rest
                  }
                  return n
                })
                updateNPC(npc.id, { nodes: updatedNodes })
              }
            }}
          />
        </div>

        {/* Detail Editor - Right */}
        <div className="flex-[1] bg-slate-800 rounded-lg p-4 space-y-4 overflow-y-auto" style={{ height: '600px' }}>
            {/* NPC Root Editor */}
            {!selectedOption || selectedOption.nodeId === 'root' ? (
              npc && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-300 border-b border-slate-700 pb-2">Edit NPC</h4>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">ID (Read-only)</label>
                    <input
                      value={npc.id || ''}
                      disabled
                      className="w-full px-3 py-2 bg-slate-600 text-slate-400 rounded text-sm cursor-not-allowed"
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
                    <label className="block text-xs text-slate-500 mb-1">Root Options ({npc.options?.length || 0})</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(npc.options || []).map((option: any, idx: number) => (
                        <div key={idx} className="space-y-1 p-2 bg-slate-700 rounded">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Text</label>
                            <input
                              value={option.text || ''}
                              onChange={(e) => {
                                const newOptions = [...(npc.options || [])]
                                newOptions[idx] = { ...newOptions[idx], text: e.target.value }
                                updateNPC(npc.id, { options: newOptions })
                              }}
                              placeholder="Option text"
                              className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Condition</label>
                            <textarea
                              value={option.condition || ''}
                              onChange={(e) => {
                                const newOptions = [...(npc.options || [])]
                                newOptions[idx] = { ...newOptions[idx], condition: e.target.value }
                                updateNPC(npc.id, { options: newOptions })
                              }}
                              placeholder="mission.example = completed AND var.level >= 5"
                              className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm font-mono"
                              rows={2}
                            />
                            {option.condition && (
                              <div className="text-xs mt-1">
                                <HighlightedCondition text={option.condition} />
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Entry Node: {option.entryNode || 'none'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (() => {
              const node = getNodeById(selectedOption.nodeId)

              return node ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-300 border-b border-slate-700 pb-2">
                    Edit {node.type} Node
                  </h4>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Node ID (Read-only)</label>
                    <input
                      value={node.id}
                      disabled
                      className="w-full px-3 py-2 bg-slate-600 text-slate-400 rounded text-sm font-mono cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Label</label>
                    <input
                      value={node.name || ''}
                      onChange={(e) => updateNodeById(node.id, { name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Type</label>
                    <select
                      value={node.type || 'dialog'}
                      onChange={(e) => updateNodeById(node.id, { type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                    >
                      <option value="dialog">Dialog</option>
                      <option value="commands">Commands</option>
                      <option value="options">Options</option>
                      <option value="condition">Condition</option>
                      <option value="shop">Shop</option>
                    </select>
                  </div>

                  {/* Dialog Type */}
                  {node.type === 'dialog' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Dialog Texts</label>
                      <div className="space-y-2">
                        {(node.texts || []).map((text: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <textarea
                              value={text}
                              onChange={(e) => {
                                const newTexts = [...node.texts]
                                newTexts[idx] = e.target.value
                                updateNodeById(node.id, { texts: newTexts })
                              }}
                              className="flex-1 px-2 py-1 bg-slate-700 text-white rounded text-sm"
                              rows={2}
                            />
                            <button
                              onClick={() => {
                                const newTexts = node.texts.filter((_: any, i: number) => i !== idx)
                                updateNodeById(node.id, { texts: newTexts })
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs h-8"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newTexts = [...(node.texts || []), 'New text']
                            updateNodeById(node.id, { texts: newTexts })
                          }}
                          className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          + Add Text
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Commands Type */}
                  {node.type === 'commands' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Actions</label>
                      <div className="space-y-2">
                        {(node.actions || []).map((action: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              value={action}
                              onChange={(e) => {
                                const newActions = [...node.actions]
                                newActions[idx] = e.target.value
                                updateNodeById(node.id, { actions: newActions })
                              }}
                              className="flex-1 px-2 py-1 bg-slate-700 text-white rounded text-sm font-mono"
                            />
                            <button
                              onClick={() => {
                                const newActions = node.actions.filter((_: any, i: number) => i !== idx)
                                updateNodeById(node.id, { actions: newActions })
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newActions = [...(node.actions || []), 'var.set key= value=']
                            updateNodeById(node.id, { actions: newActions })
                          }}
                          className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          + Add Action
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Options Type */}
                  {node.type === 'options' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Options ({node.options?.length || 0})
                      </label>
                      <div className="space-y-2">
                        {(node.options || []).map((option: any, idx: number) => (
                          <div key={idx} className="space-y-1 p-2 bg-slate-700 rounded">
                            <div className="flex gap-2">
                              <input
                                value={option.text || option}
                                onChange={(e) => {
                                  const newOptions = [...node.options]
                                  if (typeof newOptions[idx] === 'object') {
                                    newOptions[idx] = { ...newOptions[idx], text: e.target.value }
                                  } else {
                                    newOptions[idx] = { text: e.target.value, entryNode: null }
                                  }
                                  updateNodeById(node.id, { options: newOptions })
                                }}
                                placeholder={`Option ${idx + 1} text`}
                                className="flex-1 px-2 py-1 bg-slate-600 text-white rounded text-sm"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = node.options.filter((_: any, i: number) => i !== idx)
                                  updateNodeById(node.id, { options: newOptions })
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="text-xs text-slate-400">
                              Entry Node: {typeof option === 'object' ? (option.entryNode || 'none') : 'none'}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newOptions = [...(node.options || []), { text: `Option ${(node.options?.length || 0) + 1}`, entryNode: null }]
                            updateNodeById(node.id, { options: newOptions })
                          }}
                          className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Condition Type */}
                  {node.type === 'condition' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Conditions ({node.conditions?.length || 0})
                      </label>
                      <div className="space-y-2">
                        {(node.conditions || []).map((condition: any, idx: number) => (
                          <div key={idx} className="space-y-1 p-2 bg-slate-700 rounded">
                            <div className="flex gap-2 items-start">
                              <div className="flex-1 space-y-1">
                                <textarea
                                  value={condition.condition || condition}
                                  onChange={(e) => {
                                    const newConditions = [...node.conditions]
                                    if (typeof newConditions[idx] === 'object') {
                                      newConditions[idx] = { ...newConditions[idx], condition: e.target.value }
                                    } else {
                                      newConditions[idx] = { condition: e.target.value, entryNode: null }
                                    }
                                    updateNodeById(node.id, { conditions: newConditions })
                                  }}
                                  placeholder="mission.example = completed AND var.level >= 5"
                                  className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm font-mono"
                                  rows={2}
                                />
                                {(typeof condition === 'object' ? condition.condition : condition) && (
                                  <div className="text-xs">
                                    <HighlightedCondition text={typeof condition === 'object' ? condition.condition : condition} />
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  const newConditions = node.conditions.filter((_: any, i: number) => i !== idx)
                                  updateNodeById(node.id, { conditions: newConditions })
                                }}
                                className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs h-8"
                              >
                                ✕
                              </button>
                            </div>
                            <div className="text-xs text-slate-400">
                              Entry Node: {typeof condition === 'object' ? (condition.entryNode || 'none') : 'none'}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newConditions = [...(node.conditions || []), { condition: 'mission.example = completed', entryNode: null }]
                            updateNodeById(node.id, { conditions: newConditions })
                          }}
                          className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                        >
                          + Add Condition
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Shop Type */}
                  {node.type === 'shop' && (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Shop Type</label>
                      <select
                        value={node.shop_type || 'buy'}
                        onChange={(e) => updateNodeById(node.id, { shop_type: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400">Node not found</div>
              )
            })()}
          </div>
        </div>
      </>
      )}
    </div>
  )
}

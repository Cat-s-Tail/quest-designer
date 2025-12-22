import { useState } from 'react'
import { useDataStore } from '@/store/dataStore'
import { ConditionParser } from '@/lib/ConditionParser'
import QuestTree from './QuestTree'
import HighlightedCondition from './HighlightedCondition'
import Toast from './Toast'

export default function QuestEditor() {
  const { currentFile, currentData, saveFile, updateQuest, addQuest } = useDataStore()
  const [selectedQuest, setSelectedQuest] = useState(null)
  const [selectedObjective, setSelectedObjective] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [toast, setToast] = useState(null)

  const handleAddQuest = () => {
    const quest = addQuest()
    setSelectedQuest(quest.id)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveFile(currentFile, currentData)
      setToast({ message: 'Saved successfully!', type: 'success' })
    } catch (error) {
      setToast({ message: `Error saving: ${error.message}`, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStructureChange = (questId, value) => {
    const parser = new ConditionParser(value)
    const tree = parser.parse()

    if (tree || !value) {
      setParseError(null)
      updateQuest(questId, { objectiveStructure: value })
    } else {
      setParseError('Invalid condition structure')
    }
  }

  const handleAddObjective = () => {
    const newObjective = {
      id: `obj_${Date.now()}`,
      type: 'event',
      eventType: '',
      eventCondition: '',
      description: 'New Objective',
      amount: 1,
    }
    const updatedObjectives = [...(quest.objectives || []), newObjective]
    updateQuest(quest.id, { objectives: updatedObjectives })
    setSelectedObjective(newObjective.id)
  }

  const handleUpdateObjective = (updates) => {
    const updatedObjectives = (quest.objectives || []).map(obj =>
      obj.id === selectedObjective ? { ...obj, ...updates } : obj
    )
    
    // If ID changed, update the objectiveStructure references
    if (updates.id && updates.id !== selectedObjective) {
      let newStructure = quest.objectiveStructure || ''
      const regex = new RegExp(`\\b${selectedObjective}\\b`, 'g')
      newStructure = newStructure.replace(regex, updates.id)
      updateQuest(quest.id, { objectives: updatedObjectives, objectiveStructure: newStructure })
      setSelectedObjective(updates.id) // Update selected objective to new ID
    } else {
      updateQuest(quest.id, { objectives: updatedObjectives })
    }
  }

  const handleDeleteObjective = (objId) => {
    const updatedObjectives = (quest.objectives || []).filter(obj => obj.id !== objId)
    updateQuest(quest.id, { objectives: updatedObjectives })
    if (selectedObjective === objId) {
      setSelectedObjective(null)
    }
  }

  const quest = selectedQuest ? currentData.quests.find(q => q.id === selectedQuest) : null

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

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Quests</h3>
        <button
          onClick={handleAddQuest}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
        >
          + New Quest
        </button>
      </div>

      {/* Tree View and Detail Editor - Side by Side */}
      <div className="flex gap-4">
        {/* Tree View - Left (2/3 width) */}
        <div className="flex-[2] bg-slate-800 rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <QuestTree 
            quests={currentData.quests || []} 
            selectedQuest={selectedQuest} 
            onSelectQuest={setSelectedQuest}
            onAddQuest={(newQuest) => {
              currentData.quests.push(newQuest)
              set({ currentData: { ...currentData } })
            }}
            onRelink={(sourceId, targetId, isBreaking) => {
              const quest = currentData.quests.find(q => q.id === sourceId)
              if (quest) {
                if (isBreaking) {
                  // Remove the unlock
                  if (quest.unlocks) {
                    quest.unlocks = quest.unlocks.filter(id => id !== targetId)
                    updateQuest(sourceId, { unlocks: quest.unlocks })
                  }
                } else {
                  // Add the unlock
                  if (!quest.unlocks) quest.unlocks = []
                  if (!quest.unlocks.includes(targetId)) {
                    quest.unlocks.push(targetId)
                    updateQuest(sourceId, { unlocks: quest.unlocks })
                  }
                }
              }
            }}
          />
        </div>

        {/* Detail Editor - Right (1/3 width) */}
        {quest && (
          <div className="flex-[1] bg-slate-800 rounded-lg p-4 space-y-4 overflow-y-auto" style={{ height: '600px' }}>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Title</label>
              <input
                value={quest.title || ''}
                onChange={(e) => updateQuest(quest.id, { title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea
                value={quest.description || ''}
                onChange={(e) => updateQuest(quest.id, { description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded h-16"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Giver</label>
                <input
                  value={quest.giver || ''}
                  onChange={(e) => updateQuest(quest.id, { giver: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Difficulty</label>
                <select
                  value={quest.difficulty || 'easy'}
                  onChange={(e) => updateQuest(quest.id, { difficulty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded"
                >
                  <option>easy</option>
                  <option>medium</option>
                  <option>hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Objective Structure (AND/OR)
              </label>
              <textarea
                value={quest.objectiveStructure || ''}
                onChange={(e) => handleStructureChange(quest.id, e.target.value)}
                placeholder="e.g., obj1 AND obj2 OR (obj3 AND obj4)"
                className={`w-full px-3 py-2 bg-slate-700 text-white rounded h-12 font-mono ${
                  parseError ? 'border-2 border-red-500' : ''
                }`}
              />
              {parseError && <div className="text-red-500 text-sm mt-1">{parseError}</div>}
              {quest.objectiveStructure && (
                <div className="mt-2 p-2 bg-slate-700 rounded">
                  <div className="text-xs text-slate-500 mb-1">Preview:</div>
                  <HighlightedCondition text={quest.objectiveStructure} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Unlocks</label>
                <input
                  value={(quest.unlocks || []).join(', ')}
                  onChange={(e) => updateQuest(quest.id, { unlocks: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="quest1, quest2"
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Repeatable</label>
                <select
                  value={quest.repeatable ? 'true' : 'false'}
                  onChange={(e) => updateQuest(quest.id, { repeatable: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Objectives ({quest.objectives?.length || 0})</label>
              <div className="space-y-2">
                <div className="bg-slate-700 rounded p-2 max-h-40 overflow-y-auto space-y-1">
                  {(quest.objectives || []).length > 0 ? (
                    (quest.objectives || []).map(obj => (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedObjective(obj.id)}
                        className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                          selectedObjective === obj.id
                            ? 'bg-blue-600'
                            : 'bg-slate-600 hover:bg-slate-500'
                        }`}
                      >
                        <span className="text-sm">{obj.description || obj.id}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteObjective(obj.id)
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-sm">No objectives</div>
                  )}
                </div>
                <button
                  onClick={handleAddObjective}
                  className="w-full px-3 py-1 bg-green-600 hover:bg-green-700 text-sm rounded"
                >
                  + Add Objective
                </button>
              </div>
            </div>

            {/* Objective Editor */}
            {selectedObjective && (
              <div className="border-t border-slate-700 pt-4 mt-4">
                <h4 className="font-bold text-slate-300 mb-3">Edit Objective</h4>
                {(() => {
                  const obj = (quest.objectives || []).find(o => o.id === selectedObjective)
                  return obj ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">ID</label>
                        <input
                          value={obj.id}
                          onChange={(e) => handleUpdateObjective({ id: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Description</label>
                        <input
                          value={obj.description || ''}
                          onChange={(e) => handleUpdateObjective({ description: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Type</label>
                        <select
                          value={obj.type || 'event'}
                          onChange={(e) => handleUpdateObjective({ type: e.target.value })}
                          className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                        >
                          <option value="event">Event</option>
                          <option value="submit">Submit</option>
                        </select>
                      </div>

                      {obj.type === 'event' && (
                        <>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Event Type</label>
                            <input
                              value={obj.eventType || ''}
                              onChange={(e) => handleUpdateObjective({ eventType: e.target.value })}
                              placeholder="e.g., ENEMY_KILLED, ITEM_COLLECTED"
                              className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                            />
                            <div className="text-xs text-slate-400 mt-1">
                              The event type that triggers this objective
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Event Condition</label>
                            <textarea
                              value={obj.eventCondition || ''}
                              onChange={(e) => handleUpdateObjective({ eventCondition: e.target.value })}
                              placeholder="enemy_id = goblin AND damage > 50"
                              className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm font-mono"
                              rows={2}
                            />
                            {obj.eventCondition && (
                              <div className="text-xs mt-1">
                                <HighlightedCondition text={obj.eventCondition} />
                              </div>
                            )}
                            <div className="text-xs text-slate-400 mt-1">
                              Conditions checked against event data properties
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Amount</label>
                            <input
                              type="number"
                              value={obj.amount || 1}
                              onChange={(e) => handleUpdateObjective({ amount: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                            />
                          </div>
                        </>
                      )}

                      {obj.type === 'submit' && (
                        <>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Item Type or ID</label>
                            <input
                              value={obj.item || ''}
                              onChange={(e) => handleUpdateObjective({ item: e.target.value })}
                              placeholder="e.g., 'weapon' or 'item_sword_001'"
                              className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Amount</label>
                            <input
                              type="number"
                              value={obj.amount || 1}
                              onChange={(e) => handleUpdateObjective({ amount: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                            />
                          </div>
                        </>
                      )}

                      {/* Conditions Section */}
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">
                          Conditions (optional)
                        </label>
                        <div className="space-y-2">
                          {(obj.conditions || []).map((cond, idx) => (
                            <div key={idx} className="space-y-1 p-2 bg-slate-700 rounded">
                              <div className="flex gap-2">
                                <textarea
                                  value={cond}
                                  onChange={(e) => {
                                    const newConditions = [...(obj.conditions || [])]
                                    newConditions[idx] = e.target.value
                                    handleUpdateObjective({ conditions: newConditions })
                                  }}
                                  placeholder="mission.example = completed AND var.level >= 5"
                                  className="flex-1 px-2 py-1 bg-slate-600 text-white rounded text-sm font-mono"
                                  rows={2}
                                />
                                <button
                                  onClick={() => {
                                    const newConditions = (obj.conditions || []).filter((_, i) => i !== idx)
                                    handleUpdateObjective({ conditions: newConditions })
                                  }}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs h-8"
                                >
                                  ✕
                                </button>
                              </div>
                              {cond && (
                                <div className="text-xs">
                                  <HighlightedCondition text={cond} />
                                </div>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newConditions = [...(obj.conditions || []), 'mission.example = completed']
                              handleUpdateObjective({ conditions: newConditions })
                            }}
                            className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                          >
                            + Add Condition
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || !!parseError}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded transition"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


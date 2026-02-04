import { useState, useEffect } from 'react'
import ItemTree from './ItemTree'
import Toast from './Toast'
import LuaEditor from './LuaEditor'

export default function ItemEditor({ items, onUpdate, onAdd, onDelete, onSave, generateGUID }: any) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [getAllPositionsRef, setGetAllPositionsRef] = useState<(() => Map<string, { x: number; y: number }>) | null>(null)

  const item = selectedItem ? items.find((i: any) => i.id === selectedItem) : null

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim()) {
      const results = items.filter((i: any) => 
        i.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.type || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setSearchResults(results)
      setShowSearchDropdown(results.length > 0)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }, [searchTerm, items])

  const handleAddItem = () => {
    const newItem = {
      id: generateGUID(),
      name: 'New Item',
      description: '',
      icon: '',
      worldPrefab: '',
      type: 'generic',
      size: [1, 1],
      weight: 1.0,
      maxStack: 1,
      fractional: false,
      maxDurability: -1,
      rarity: 0,
      customProperties: {},
      actions: [],
      next: [],
      position: { x: 0, y: 0 }
    }
    onAdd(newItem)
    setSelectedItem(newItem.id)
  }

  const handleDeleteItem = () => {
    if (!item) return
    if (confirm(`Delete item "${item.name || item.id}"?`)) {
      onDelete(item.id)
      setSelectedItem(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 保存前从 Tree 获取所有节点的当前位置
      if (getAllPositionsRef && typeof getAllPositionsRef === 'function') {
        const allPositions = getAllPositionsRef()
        allPositions.forEach((position, itemId) => {
          const item = items.find((i: any) => i.id === itemId)
          // 只有当位置不同时才更新
          if (item && (item.position?.x !== position.x || item.position?.y !== position.y)) {
            onUpdate(itemId, { position })
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

  const handleSelectFromSearch = (itemId: string) => {
    setSelectedItem(itemId)
    setSearchTerm('')
    setShowSearchDropdown(false)
  }

  const handleRelink = (sourceId: string, targetId: string) => {
    const sourceItem = items.find((i: any) => i.id === sourceId)
    if (!sourceItem) return
    
    const next = sourceItem.next || []
    if (!next.includes(targetId)) {
      onUpdate(sourceId, { next: [...next, targetId] })
    }
  }

  const handleUpdatePosition = (itemId: string, position: { x: number; y: number }) => {
    // 立即更新到数据中
    onUpdate(itemId, { position })
  }

  const addAction = () => {
    if (!item) return
    const actions = item.actions || []
    const newAction = {
      name: 'new_action',
      canExecute: 'return true',
      onExecute: '-- Action logic here\ncontext.consumed = false\ncontext.message = "Action executed"'
    }
    onUpdate(item.id, { actions: [...actions, newAction] })
  }

  const updateAction = (index: number, updates: any) => {
    if (!item) return
    const actions = [...(item.actions || [])]
    actions[index] = { ...actions[index], ...updates }
    onUpdate(item.id, { actions })
  }

  const deleteAction = (index: number) => {
    if (!item) return
    const actions = (item.actions || []).filter((_: any, i: number) => i !== index)
    onUpdate(item.id, { actions })
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
          <h3 className="font-bold text-lg text-green-400">Items</h3>
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search items by ID/name/type..."
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
                {searchResults.map((i: any) => (
                  <div
                    key={i.id}
                    onClick={() => handleSelectFromSearch(i.id)}
                    className="px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700"
                  >
                    <div className="font-semibold text-sm">{i.name}</div>
                    <div className="text-xs text-slate-400">{i.id} • {i.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddItem} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">
            Add Item
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded">
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-4" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Left: Graph */}
        <div className="bg-slate-800 rounded overflow-hidden">
          <ItemTree
            items={items}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onAddItem={handleAddItem}
            onRelink={handleRelink}
            onUpdatePosition={handleUpdatePosition}
            onGetAllPositions={setGetAllPositionsRef}
          />
        </div>

        {/* Right: Editor */}
        <div className="bg-slate-800 rounded p-4 overflow-y-auto">
          {item ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-green-400">Edit Item</h4>
                <button onClick={handleDeleteItem} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                  Delete
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">ID</label>
                <input
                  type="text"
                  value={item.id}
                  onChange={(e) => onUpdate(item.id, { id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  value={item.description}
                  onChange={(e) => onUpdate(item.id, { description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Icon (Addressable)</label>
                  <input
                    type="text"
                    value={item.icon || ''}
                    onChange={(e) => onUpdate(item.id, { icon: e.target.value })}
                    placeholder="icon_key"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">World Prefab (Addressable)</label>
                  <input
                    type="text"
                    value={item.worldPrefab || ''}
                    onChange={(e) => onUpdate(item.id, { worldPrefab: e.target.value })}
                    placeholder="prefab_key"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Type</label>
                  <input
                    type="text"
                    value={item.type}
                    onChange={(e) => onUpdate(item.id, { type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Rarity</label>
                  <input
                    type="number"
                    value={item.rarity || 0}
                    onChange={(e) => onUpdate(item.id, { rarity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.weight}
                    onChange={(e) => onUpdate(item.id, { weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Size [W, H]</label>
                  <input
                    type="text"
                    value={JSON.stringify(item.size || [1, 1])}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        if (Array.isArray(parsed) && parsed.length === 2) {
                          onUpdate(item.id, { size: parsed })
                        }
                      } catch {}
                    }}
                    placeholder="[1, 1]"
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold mb-1">Max Stack (1 = not stackable)</label>
                  <input
                    type="number"
                    min="1"
                    value={item.maxStack || 1}
                    onChange={(e) => {
                      const newMaxStack = Math.max(1, parseInt(e.target.value) || 1)
                      onUpdate(item.id, { maxStack: newMaxStack })
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    {(item.maxStack || 1) > 1 ? 'Fractional (decimal amounts)' : 'Max Durability (-1 = none)'}
                  </label>
                  {(item.maxStack || 1) > 1 ? (
                    <div className="flex items-center h-full">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.fractional || false}
                          onChange={(e) => onUpdate(item.id, { fractional: e.target.checked })}
                        />
                        Allow fractional
                      </label>
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="0.1"
                      value={item.maxDurability ?? -1}
                      onChange={(e) => onUpdate(item.id, { maxDurability: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold">Actions</label>
                  <button onClick={addAction} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs">
                    Add Action
                  </button>
                </div>
                <div className="space-y-3">
                  {(item.actions || []).map((action: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-700 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={action.name}
                          onChange={(e) => updateAction(idx, { name: e.target.value })}
                          className="flex-1 px-2 py-1 bg-slate-600 text-white rounded text-sm font-semibold"
                          placeholder="Action name (e.g., use, repair)"
                        />
                        <button onClick={() => deleteAction(idx)} className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">
                          ×
                        </button>
                      </div>
                      
                      <div className="mb-2">
                        <label className="block text-xs text-slate-400 mb-1">canExecute (Lua - return true/false)</label>
                        <LuaEditor
                          value={action.canExecute || ''}
                          onChange={(value) => updateAction(idx, { canExecute: value })}
                          height="100px"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">onExecute (Lua - set context.consumed, context.message)</label>
                        <LuaEditor
                          value={action.onExecute || ''}
                          onChange={(value) => updateAction(idx, { onExecute: value })}
                          height="150px"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Properties */}
              <div>
                <label className="block text-sm font-semibold mb-1">Custom Properties (JSON)</label>
                <textarea
                  value={JSON.stringify(item.customProperties || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      onUpdate(item.id, { customProperties: parsed })
                    } catch {}
                  }}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm font-mono"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 mt-20">
              Select an item from the graph to edit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

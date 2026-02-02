import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api`

// Helper to get current project from localStorage
const getCurrentProject = () => {
  if (typeof window === 'undefined') return 'default'
  try {
    const stored = localStorage.getItem('quest-designer-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.state?.currentProject || 'default'
    }
  } catch (e) {
    console.error('Error reading project from localStorage:', e)
  }
  return 'default'
}

export const useDataStore = create(
  persist(
    (set, get) => ({
      // State
      currentProject: 'default',
      files: { npcs: [], quests: [], other: [] },
      currentFile: null,
      currentData: null,
      loading: false,
      error: null,
      pendingProject: null, // Track unsaved project changes

      // Project operations
      setProject: (project) => {
        // Only update pendingProject, don't change currentProject yet
        set({ pendingProject: project })
      },

      // Apply project change and reload files
      applyProject: async () => {
        const pendingProject = get().pendingProject
        if (pendingProject === null) return // No changes to apply
        
        set({ 
          currentProject: pendingProject, 
          pendingProject: null,
          currentFile: null, 
          currentData: null 
        })
        
        // Reload files with new project
        await get().loadFiles()
      },

      // Cancel pending project changes
      cancelProjectChange: () => {
        set({ pendingProject: null })
      },

      // File operations
      loadFiles: async () => {
        set({ loading: true, error: null })
        try {
          const project = getCurrentProject()
          const response = await axios.get(`${API_BASE}/files/files`, {
            params: { project }
          })
          set({ files: response.data })
        } catch (error) {
          set({ error: error.message })
        } finally {
          set({ loading: false })
        }
      },

      loadFile: async (filePath) => {
        set({ loading: true, error: null })
        try {
          const project = getCurrentProject()
          const response = await axios.get(`${API_BASE}/files/file`, {
            params: { path: filePath, project }
          })
          set({ currentFile: filePath, currentData: response.data })
        } catch (error) {
          set({ error: error.message })
        } finally {
          set({ loading: false })
        }
      },

      saveFile: async (filePath, content) => {
        set({ loading: true, error: null })
        try {
          const project = getCurrentProject()
          const response = await axios.post(`${API_BASE}/files/file`, {
            path: filePath,
            content
          }, {
            params: { project }
          })
          set({ currentFile: filePath, currentData: content })
          return response.data
        } catch (error) {
          set({ error: error.message })
          throw error
        } finally {
          set({ loading: false })
        }
      },

      createFile: async (filePath, template = 'npcs') => {
        set({ loading: true, error: null })
        try {
          const project = getCurrentProject()
          const response = await axios.post(`${API_BASE}/files/create`, {
            path: filePath,
            template
          }, {
            params: { project }
          })
          await get().loadFiles()
          return response.data
        } catch (error) {
          set({ error: error.message })
          throw error
        } finally {
          set({ loading: false })
        }
      },

      deleteFile: async (filePath) => {
        set({ loading: true, error: null })
        try {
          const project = getCurrentProject()
          await axios.delete(`${API_BASE}/files/file`, {
            params: { path: filePath, project }
          })
          if (get().currentFile === filePath) {
            set({ currentFile: null, currentData: null })
          }
          await get().loadFiles()
        } catch (error) {
          set({ error: error.message })
          throw error
        } finally {
          set({ loading: false })
        }
      },

      // Data mutations
      updateNPC: (npcId, updates) => {
        const data = get().currentData
        if (!data || !data.npcs) return

        const npcIndex = data.npcs.findIndex(n => n.id === npcId)
        if (npcIndex >= 0) {
          data.npcs[npcIndex] = { ...data.npcs[npcIndex], ...updates }
          set({ currentData: { ...data } })
        }
      },

      updateQuest: (questId, updates) => {
        const data = get().currentData
        if (!data) return
        
        // Support both 'quests' and 'missions' keys
        const key = data.missions ? 'missions' : 'quests'
        if (!data[key]) return

        const questIndex = data[key].findIndex(q => q.id === questId)
        if (questIndex >= 0) {
          data[key][questIndex] = { ...data[key][questIndex], ...updates }
          set({ currentData: { ...data } })
        }
      },

      updateMission: (missionId, updates) => {
        // Alias for updateQuest to support new mission terminology
        return get().updateQuest(missionId, updates)
      },

      addNPC: () => {
        const data = get().currentData
        if (!data || !data.npcs) return

        const newNPC = {
          id: `npc_${Date.now()}`,
          name: 'New NPC',
          description: '',
          avatar: '',
          entryNodes: [],
          nodes: [],
          position: { x: 0, y: 0 }
        }

        data.npcs.push(newNPC)
        set({ currentData: { ...data } })
        return newNPC
      },

      addQuest: () => {
        const data = get().currentData
        if (!data) return
        
        // Support both 'quests' and 'missions' keys
        const key = data.missions ? 'missions' : 'quests'
        if (!data[key]) data[key] = []

        const newQuest = {
          id: `mission_${Date.now()}`,
          name: 'New Mission',
          description: '',
          category: 'general',
          canUnlock: 'true',
          conditions: { and: [] },
          onEvent: [],
          position: { x: 0, y: 0 }
        }

        data[key].push(newQuest)
        set({ currentData: { ...data } })
        return newQuest
      },

      addMission: () => {
        // Alias for addQuest to support new mission terminology
        return get().addQuest()
      },

      deleteQuest: (questId) => {
        const data = get().currentData
        if (!data) return
        
        // Support both 'quests' and 'missions' keys
        const key = data.missions ? 'missions' : 'quests'
        if (!data[key]) return

        // Remove the quest
        const updatedQuests = data[key].filter(q => q.id !== questId)
        
        // Clean up references in other quests' unlocks
        const cleanedQuests = updatedQuests.map(q => ({
          ...q,
          unlocks: (q.unlocks || []).filter(id => id !== questId)
        }))

        set({ currentData: { ...data, [key]: cleanedQuests } })
      },

      deleteMission: (missionId) => {
        // Alias for deleteQuest to support new mission terminology
        return get().deleteQuest(missionId)
      },

      // Helper to generate GUID for node IDs
      generateGUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      },

      // Clear all data for current project
      clearProjectData: async () => {
        set({ loading: true, error: null })
        try {
          const project = getCurrentProject()
          const response = await axios.post(`${API_BASE}/files/clear-project`, {}, {
            params: { project }
          })
          
          // Reload files after clearing
          await get().loadFiles()
          set({ currentFile: null, currentData: null })
          
          return response.data
        } catch (error) {
          set({ error: error.message })
          throw error
        } finally {
          set({ loading: false })
        }
      }
    }),
    {
      name: 'quest-designer-storage',
      partialize: (state) => ({ currentProject: state.currentProject })
    }
  )
)

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
        if (!data || !data.quests) return

        const questIndex = data.quests.findIndex(q => q.id === questId)
        if (questIndex >= 0) {
          data.quests[questIndex] = { ...data.quests[questIndex], ...updates }
          set({ currentData: { ...data } })
        }
      },

      addNPC: () => {
        const data = get().currentData
        if (!data || !data.npcs) return

        const newNPC = {
          id: `npc_${Date.now()}`,
          name: 'New NPC',
          description: '',
          location: '',
          options: []
        }

        data.npcs.push(newNPC)
        set({ currentData: { ...data } })
        return newNPC
      },

      addQuest: () => {
        const data = get().currentData
        if (!data || !data.quests) return

        const newQuest = {
          id: `quest_${Date.now()}`,
          title: 'New Quest',
          description: '',
          giver: '',
          category: '',
          difficulty: 'easy',
          objectiveStructure: '',
          objectives: [],
          rewards: { xp: 0, money: 0, reputation: 0, items: [] },
          unlocks: [],
          repeatable: false
        }

        data.quests.push(newQuest)
        set({ currentData: { ...data } })
        return newQuest
      },

      deleteQuest: (questId) => {
        const data = get().currentData
        if (!data || !data.quests) return

        // Remove the quest
        const updatedQuests = data.quests.filter(q => q.id !== questId)
        
        // Clean up references in other quests' unlocks
        const cleanedQuests = updatedQuests.map(q => ({
          ...q,
          unlocks: (q.unlocks || []).filter(id => id !== questId)
        }))

        set({ currentData: { ...data, quests: cleanedQuests } })
      }
    }),
    {
      name: 'quest-designer-storage',
      partialize: (state) => ({ currentProject: state.currentProject })
    }
  )
)

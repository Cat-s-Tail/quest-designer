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

      updateMission: (missionId, updates) => {
        const data = get().currentData
        if (!data || !data.missions) return

        const missionIndex = data.missions.findIndex(m => m.id === missionId)
        if (missionIndex >= 0) {
          data.missions[missionIndex] = { ...data.missions[missionIndex], ...updates }
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
          avatar: '',
          entryNodes: [],
          nodes: [],
          position: { x: 0, y: 0 }
        }

        data.npcs.push(newNPC)
        set({ currentData: { ...data } })
        return newNPC
      },

      addMission: () => {
        const data = get().currentData
        if (!data || !data.missions) data.missions = []

        const newMission = {
          id: `mission_${Date.now()}`,
          name: 'New Mission',
          description: '',
          category: 'general',
          canUnlock: 'true',
          conditions: { and: [] },
          onEvent: [],
          position: { x: 0, y: 0 }
        }

        data.missions.push(newMission)
        set({ currentData: { ...data } })
        return newMission
      },

      deleteMission: (missionId) => {
        const data = get().currentData
        if (!data || !data.missions) return

        // Remove the mission
        const updatedMissions = data.missions.filter(m => m.id !== missionId)
        
        // Clean up references in other missions' unlocks
        const cleanedMissions = updatedMissions.map(m => ({
          ...m,
          unlocks: (m.unlocks || []).filter(id => id !== missionId)
        }))

        set({ currentData: { ...data, missions: cleanedMissions } })
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

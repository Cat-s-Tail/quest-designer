import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_BASE = 'http://localhost:3001/api'

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

      // Project operations
      setProject: (project) => {
        set({ currentProject: project, currentFile: null, currentData: null })
      },

      // File operations
      loadFiles: async () => {
        set({ loading: true, error: null })
        try {
          const response = await axios.get(`${API_BASE}/files/files`)
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
          const response = await axios.get(`${API_BASE}/files/file`, {
            params: { path: filePath }
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
          const project = get().currentProject
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
          const project = get().currentProject
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
          const project = get().currentProject
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
      }
    }),
    {
      name: 'quest-designer-storage',
      partialize: (state) => ({ currentProject: state.currentProject })
    }
  )
)

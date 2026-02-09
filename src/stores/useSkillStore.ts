import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import type { ManagedSkill } from '../components/skills/types'

interface SkillState {
    skills: ManagedSkill[]
    loading: boolean
    error: string | null
    searchQuery: string
    sortBy: 'updated' | 'name'

    fetchSkills: () => Promise<void>
    setSearchQuery: (query: string) => void
    setSortBy: (sortBy: 'updated' | 'name') => void
}

// Define type explicitly to avoid circular inference
export const useSkillStore = create<SkillState>((set) => ({
    skills: [],
    loading: false,
    error: null,
    searchQuery: '',
    sortBy: 'updated',

    fetchSkills: async () => {
        set({ loading: true, error: null })
        try {
            // Assuming command is 'get_managed_skills'
            const skills = await invoke<ManagedSkill[]>('get_managed_skills')
            set({ skills, loading: false })
        } catch (err) {
            set({ error: err instanceof Error ? err.message : String(err), loading: false })
        }
    },

    setSearchQuery: (query) => set({ searchQuery: query }),
    setSortBy: (sortBy) => set({ sortBy })
}))

import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import type { ToolStatusDto, ToolOption } from '../components/skills/types'

interface ToolState {
    status: ToolStatusDto | null
    loading: boolean
    error: string | null

    // Derived data
    tools: ToolOption[]
    installedToolIds: string[]

    fetchStatus: () => Promise<void>
}

export const useToolStore = create<ToolState>((set) => ({
    status: null,
    loading: false,
    error: null,
    tools: [],
    installedToolIds: [],

    fetchStatus: async () => {
        set({ loading: true, error: null })
        try {
            const status = await invoke<ToolStatusDto>('get_tool_status')

            const tools = status.tools.map((t) => ({
                id: t.key,
                label: t.label, // Note: i18n label handling needs to be done in component
            }))

            set({
                status,
                tools,
                installedToolIds: status.installed,
                loading: false
            })
        } catch (err) {
            set({
                error: err instanceof Error ? err.message : String(err),
                loading: false
            })
        }
    },
}))

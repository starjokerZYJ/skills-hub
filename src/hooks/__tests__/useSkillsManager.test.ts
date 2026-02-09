import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSkillsManager } from '../useSkillsManager'
import { useAppStore } from '../../stores/useAppStore'
import { useToolStore } from '../../stores/useToolStore'
import { invoke } from '@tauri-apps/api/core'

// Mock Stores
vi.mock('../../stores/useToolStore', () => ({
    useToolStore: vi.fn(),
}))
vi.mock('../../stores/useSkillStore', () => ({
    useSkillStore: vi.fn().mockReturnValue({ fetchSkills: vi.fn() }),
}))

// Mock AppStore methods (we use the real store for state, but partial mock might be easier)
// Actually we can just spy on the real store methods if we want, or rely on the real store logic since we tested it.
// But useSkillsManager calls `setLoading`, `setSuccess`, `setError`.
// Let's rely on the real useAppStore since we just tested it!
// But we need to mock useToolStore to provide tools.

describe('useSkillsManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAppStore.setState({ isLoading: false, error: null, successMessage: null })
        // Setup Mock Tools
        // @ts-ignore
        useToolStore.mockReturnValue({
            tools: [{ id: 'tool-1', label: 'Tool 1' }],
            installedToolIds: ['tool-1']
        })
    })

    it('addLocalSkill should handle success flow with single candidate', async () => {
        // Mock invoke responses
        const mockInvoke = invoke as any
        mockInvoke.mockImplementation((cmd: string, _args: any) => {
            if (cmd === 'list_local_skills_cmd') {
                return Promise.resolve([{ valid: true, name: 'skill-1', subpath: 'skill-1' }])
            }
            if (cmd === 'install_local_selection') {
                return Promise.resolve({
                    skill_id: 'skill-id-1',
                    central_path: '/central/skill-1',
                    name: 'skill-1'
                })
            }
            if (cmd === 'sync_skill_to_tool') {
                return Promise.resolve()
            }
            return Promise.resolve()
        })

        const { result } = renderHook(() => useSkillsManager())

        await act(async () => {
            await result.current.addLocalSkill('/tmp/skills', 'My Skill', { 'tool-1': true })
        })

        // Assertions
        expect(mockInvoke).toHaveBeenCalledWith('list_local_skills_cmd', { basePath: '/tmp/skills' })
        expect(mockInvoke).toHaveBeenCalledWith('install_local_selection', {
            basePath: '/tmp/skills',
            subpath: 'skill-1',
            name: 'My Skill'
        })
        expect(mockInvoke).toHaveBeenCalledWith('sync_skill_to_tool', {
            sourcePath: '/central/skill-1',
            skillId: 'skill-id-1',
            tool: 'tool-1',
            name: 'skill-1'
        })

        // Check Store state
        expect(useAppStore.getState().successMessage).toBe('status.localSkillCreated')
        expect(useAppStore.getState().isLoading).toBe(false)
    })

    it('addLocalSkill should handle error', async () => {
        const mockInvoke = invoke as any
        mockInvoke.mockRejectedValue(new Error('Tauri Error'))

        const { result } = renderHook(() => useSkillsManager())

        await act(async () => {
            await result.current.addLocalSkill('/tmp/bad', '', {})
        })

        expect(useAppStore.getState().error).toBe('Tauri Error')
        expect(useAppStore.getState().isLoading).toBe(false)
    })
})

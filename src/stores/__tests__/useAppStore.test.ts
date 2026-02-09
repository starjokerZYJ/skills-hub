import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../useAppStore'

describe('useAppStore', () => {
    beforeEach(() => {
        // optional: reset store if needed, but Zustand is persistent.
        // For unit tests, usually we want a fresh store. 
        // Since we use persist middleware, we might need to clear storage.
        localStorage.clear()
        useAppStore.setState({
            theme: 'system',
            language: 'en',
            isLoading: false,
            modals: {
                settings: false,
                addSkill: false,
                import: false,
                newTools: false,
                gitPick: false,
                localPick: false,
            }
        })
    })

    it('should have default state', () => {
        const state = useAppStore.getState()
        expect(state.theme).toBe('system')
        expect(state.language).toBe('en')
        expect(state.isLoading).toBe(false)
    })

    it('should toggle theme', () => {
        useAppStore.getState().setTheme('dark')
        expect(useAppStore.getState().theme).toBe('dark')
    })

    it('should open and close modals', () => {
        useAppStore.getState().openModal('settings')
        expect(useAppStore.getState().modals.settings).toBe(true)

        useAppStore.getState().closeModal('settings')
        expect(useAppStore.getState().modals.settings).toBe(false)
    })

    it('should handle global loading state', () => {
        useAppStore.getState().setLoading(true, 'Test loading')
        expect(useAppStore.getState().isLoading).toBe(true)
        expect(useAppStore.getState().actionMessage).toBe('Test loading')
        expect(useAppStore.getState().loadingStartAt).not.toBeNull()

        useAppStore.getState().setLoading(false)
        expect(useAppStore.getState().isLoading).toBe(false)
    })
})

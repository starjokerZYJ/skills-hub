import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
    theme: 'system' | 'light' | 'dark'
    language: string
    setTheme: (theme: 'system' | 'light' | 'dark') => void
    setLanguage: (lang: string) => void

    // Modals
    modals: {
        settings: boolean
        addSkill: boolean
        import: boolean
        newTools: boolean
        gitPick: boolean
        localPick: boolean
    }
    openModal: (modal: keyof AppState['modals']) => void
    closeModal: (modal: keyof AppState['modals']) => void
    closeAllModals: () => void

    // Global Status
    isLoading: boolean
    loadingStartAt: number | null
    actionMessage: string | null
    error: string | null
    successMessage: string | null

    setLoading: (loading: boolean, message?: string | null) => void
    setError: (error: string | null) => void
    setSuccess: (message: string | null) => void
    clearStatus: () => void
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            theme: 'system',
            language: 'en',
            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            modals: {
                settings: false,
                addSkill: false,
                import: false,
                newTools: false,
                gitPick: false,
                localPick: false,
            },

            isLoading: false,
            loadingStartAt: null,
            actionMessage: null,
            error: null,
            successMessage: null,

            openModal: (modal) =>
                set((state) => ({ modals: { ...state.modals, [modal]: true } })),
            closeModal: (modal) =>
                set((state) => ({ modals: { ...state.modals, [modal]: false } })),
            closeAllModals: () =>
                set({
                    modals: {
                        settings: false,
                        addSkill: false,
                        import: false,
                        newTools: false,
                        gitPick: false,
                        localPick: false,
                    },
                }),

            setLoading: (loading, message = null) => set({
                isLoading: loading,
                actionMessage: message,
                loadingStartAt: loading ? Date.now() : null
            }),
            setError: (error) => set({ error, isLoading: false, loadingStartAt: null }),
            setSuccess: (message) => set({ successMessage: message, isLoading: false, loadingStartAt: null }),
            clearStatus: () => set({ error: null, successMessage: null, actionMessage: null })
        }),
        {
            name: 'skills-app-storage',
            partialize: (state) => ({ theme: state.theme, language: state.language }),
        },
    ),
)

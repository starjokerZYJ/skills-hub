import { useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { useTranslation } from 'react-i18next'

export const useTauriEvents = () => {
    const { theme } = useAppStore()
    const { i18n } = useTranslation()
    const isTauri = typeof window !== 'undefined' && (
        Boolean((window as any).__TAURI__) ||
        Boolean((window as any).__TAURI_INTERNALS__)
    )

    // Sync language from store to i18n
    useEffect(() => {
        if (i18n.language !== useAppStore.getState().language) {
            i18n.changeLanguage(useAppStore.getState().language)
        }
    }, [])

    // Theme handling
    useEffect(() => {
        if (typeof window === 'undefined') return
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const updateSystemTheme = () => {
            // Logic to handle system theme changes if needed, 
            // generally managed by the store's 'system' setting resolving to actual theme
        }

        if (media.addEventListener) {
            media.addEventListener('change', updateSystemTheme)
        } else {
            media.addListener(updateSystemTheme)
        }
        return () => {
            if (media.removeEventListener) {
                media.removeEventListener('change', updateSystemTheme)
            } else {
                media.removeListener(updateSystemTheme)
            }
        }
    }, [])

    // Apply theme to document
    useEffect(() => {
        if (typeof document === 'undefined') return

        let resolvedTheme = theme
        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            resolvedTheme = systemTheme
        }

        document.documentElement.dataset.theme = resolvedTheme
        document.documentElement.style.colorScheme = resolvedTheme
    }, [theme])

    return { isTauri }
}

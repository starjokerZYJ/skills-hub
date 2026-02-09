import { useTranslation } from 'react-i18next'
import { useAppStore } from '../stores/useAppStore'

const SettingsPage = () => {
    const { t } = useTranslation()
    const { theme, setTheme } = useAppStore()

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{t('settings.title', { defaultValue: 'Settings' })}</h1>

            <div className="section mb-6">
                <h2 className="text-lg font-semibold mb-2">{t('settings.appearance', { defaultValue: 'Appearance' })}</h2>
                <div className="flex gap-4">
                    <button onClick={() => setTheme('light')} className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}>Light</button>
                    <button onClick={() => setTheme('dark')} className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}>Dark</button>
                    <button onClick={() => setTheme('system')} className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-ghost'}`}>System</button>
                </div>
            </div>
        </div>
    )
}

export default SettingsPage

import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../../stores/useAppStore'

type SettingsModalProps = {
  onClose: () => void
}

const SettingsModal = ({ onClose }: SettingsModalProps) => {
  const { t } = useTranslation()
  const { theme, setTheme, language, setLanguage } = useAppStore()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t('settings')}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="label">{t('appearance')}</label>
            <div className="btn-group">
              <button
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTheme('light')}
              >Light</button>
              <button
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTheme('dark')}
              >Dark</button>
              <button
                className={`btn ${theme === 'system' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTheme('system')}
              >System</button>
            </div>
          </div>

          <div className="form-group">
            <label className="label">{t('language')}</label>
            <div className="btn-group">
              <button
                className={`btn ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLanguage('en')}
              >English</button>
              <button
                className={`btn ${language === 'zh' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLanguage('zh')}
              >中文</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(SettingsModal)

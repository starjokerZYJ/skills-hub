import { memo } from 'react'
import { Plus, Settings, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../stores/useAppStore'

// Header now self-contained with tabs
const Header = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { language, setLanguage, openModal, isLoading } = useAppStore()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en')
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="skills-header">
      <div className="brand-area">
        <img className="logo-icon" src="/logo.png" alt="" />
        <div className="brand-text-wrap">
          <div className="brand-text">{t('appName')}</div>
          <div className="brand-subtitle">{t('subtitle')}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="header-tabs">
        <button
          className={`tab-btn ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          {t('nav.mySkills')}
        </button>
        <button
          className={`tab-btn ${isActive('/discover') ? 'active' : ''}`}
          onClick={() => navigate('/discover')}
        >
          <Compass size={16} />
          {t('nav.discover')}
        </button>
      </nav>

      <div className="header-actions">
        <button className="lang-btn" type="button" onClick={toggleLanguage}>
          {language === 'en' ? t('languageShort.en') : t('languageShort.zh')}
        </button>
        <button className="icon-btn" type="button" onClick={() => openModal('settings')}>
          <Settings size={18} />
        </button>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => openModal('addSkill')}
          disabled={isLoading}
        >
          <Plus size={16} />
          {t('newSkill')}
        </button>
      </div>
    </header>
  )
}

export default memo(Header)

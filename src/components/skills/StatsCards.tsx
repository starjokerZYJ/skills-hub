import { memo } from 'react'
import type { TFunction } from 'i18next'
import './StatsCards.css'

type StatsCardsProps = {
    skillsCount: number
    syncedToolsCount: number
    totalToolsCount: number
    pendingUpdates: number
    t: TFunction
}

const StatsCards = ({
    skillsCount,
    syncedToolsCount,
    totalToolsCount,
    pendingUpdates,
    t
}: StatsCardsProps) => {
    return (
        <div className="stats-cards">
            <div className="stat-card stat-skills">
                <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                </div>
                <div className="stat-content">
                    <div className="stat-value">{skillsCount}</div>
                    <div className="stat-label">{t('stats.skills')}</div>
                </div>
            </div>

            <div className="stat-card stat-tools">
                <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                </div>
                <div className="stat-content">
                    <div className="stat-value">
                        {syncedToolsCount}
                        <span className="stat-total">/ {totalToolsCount}</span>
                    </div>
                    <div className="stat-label">{t('stats.toolsSynced')}</div>
                </div>
            </div>

            <div className={`stat-card stat-updates ${pendingUpdates > 0 ? 'has-updates' : ''}`}>
                <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                </div>
                <div className="stat-content">
                    <div className="stat-value">{pendingUpdates}</div>
                    <div className="stat-label">{t('stats.updatesAvailable')}</div>
                </div>
            </div>
        </div>
    )
}

export default memo(StatsCards)

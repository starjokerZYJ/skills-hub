import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSkillStore } from '../stores/useSkillStore'
import { useToolStore } from '../stores/useToolStore'
import { useAppStore } from '../stores/useAppStore'
import { useState } from 'react'
import FilterBar from '../components/skills/FilterBar'
import StatsCards from '../components/skills/StatsCards'
import SkillsList from '../components/skills/SkillsList'
import AddSkillModal from '../components/skills/modals/AddSkillModal'
import SettingsModal from '../components/skills/modals/SettingsModal'
import ImportModal from '../components/skills/modals/ImportModal'
import { useSkillsManager } from '../hooks/useSkillsManager'
import type { OnboardingPlan } from '../components/skills/types'

const DashboardPage = () => {
    const { skills, loading: skillsLoading, fetchSkills, searchQuery, sortBy } = useSkillStore()
    const { tools, installedToolIds } = useToolStore()
    const { modals, closeModal, openModal } = useAppStore()
    const { t } = useTranslation()
    const { deleteSkill, updateSkill, toggleToolSync, syncAllTools, getOnboardingPlan } = useSkillsManager()

    const [plan, setPlan] = useState<OnboardingPlan | null>(null)

    useEffect(() => {
        fetchSkills()
        getOnboardingPlan().then(setPlan)
    }, [fetchSkills, getOnboardingPlan])

    // Compute stats
    const stats = useMemo(() => {
        // Count unique tools that have at least one skill synced
        const syncedToolIds = new Set<string>()
        skills.forEach(skill => {
            skill.targets.forEach(t => syncedToolIds.add(t.tool))
        })
        // Pending updates: for now, 0 (could be computed from source diff in future)
        return {
            skillsCount: skills.length,
            syncedToolsCount: syncedToolIds.size,
            totalToolsCount: installedToolIds.length,
            pendingUpdates: 0
        }
    }, [skills, installedToolIds])

    // Helper functions to be implemented or connected to store actions
    const handleReviewImport = () => openModal('import')

    // NOTE: filtering moved to store selectors ideally, here we do simple local filtering
    const visibleSkills = skills.filter(s => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return s.name.toLowerCase().includes(q)
    }).sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return (b.updated_at ?? 0) - (a.updated_at ?? 0)
    })

    return (
        <>
            <StatsCards
                skillsCount={stats.skillsCount}
                syncedToolsCount={stats.syncedToolsCount}
                totalToolsCount={stats.totalToolsCount}
                pendingUpdates={stats.pendingUpdates}
                t={t}
            />

            <FilterBar
                searchQuery={searchQuery}
                sortBy={sortBy}
                loading={skillsLoading}
                onSearchChange={(v) => useSkillStore.getState().setSearchQuery(v)}
                onSortChange={(v) => useSkillStore.getState().setSortBy(v)}
                onRefresh={fetchSkills}
                t={t}
            />

            <div className="content-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                <SkillsList
                    plan={plan}
                    visibleSkills={visibleSkills}
                    installedTools={tools.filter(t => installedToolIds.includes(t.id))}
                    loading={skillsLoading}
                    // Pass dummy or real handlers
                    getGithubInfo={(url) => {
                        if (!url) return null
                        if (url.includes('github.com')) {
                            // Extract owner/repo
                            const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
                            if (match) return { label: `${match[1]}/${match[2].replace('.git', '')}`, href: url }
                        }
                        return { label: 'Git', href: url }
                    }}
                    getSkillSourceLabel={(s) => {
                        // Truncate path for display
                        const parts = s.central_path.split(/[/\\]/)
                        return parts.length > 3 ? `.../${parts.slice(-2).join('/')}` : s.central_path
                    }}
                    formatRelative={(ms) => {
                        if (!ms) return '-'
                        const diff = Date.now() - ms
                        const hours = Math.floor(diff / (1000 * 60 * 60))
                        if (hours < 1) return t('justNow')
                        if (hours < 24) return t('hoursAgo', { count: hours })
                        const days = Math.floor(hours / 24)
                        return t('daysAgo', { count: days })
                    }}
                    onReviewImport={handleReviewImport}
                    onUpdateSkill={(skill) => updateSkill(skill.id, skill.name)}
                    onDeleteSkill={(skillId) => deleteSkill(skillId)}
                    onToggleTool={(skill, toolId) => {
                        const isSynced = skill.targets.some(t => t.tool === toolId)
                        toggleToolSync({ id: skill.id, name: skill.name, central_path: skill.central_path }, toolId, isSynced)
                    }}
                    onSyncAll={(skill, sync) => {
                        syncAllTools(skill, sync)
                    }}
                    t={t}
                />
            </div>

            {/* Modals - Temporarily kept here until we decide if they should be global or routing based */}
            {modals.addSkill && <AddSkillModal onClose={() => closeModal('addSkill')} />}
            {modals.settings && <SettingsModal onClose={() => closeModal('settings')} />}
            {modals.import && <ImportModal onClose={() => closeModal('import')} onFinish={() => {
                fetchSkills()
                getOnboardingPlan().then(setPlan)
            }} />}

        </>
    )
}

export default DashboardPage

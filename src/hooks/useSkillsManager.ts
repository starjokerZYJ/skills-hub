import { invoke } from '@tauri-apps/api/core'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../stores/useAppStore'
import { useToolStore } from '../stores/useToolStore'
import { useSkillStore } from '../stores/useSkillStore'
import type { InstallResultDto, OnboardingPlan } from '../components/skills/types'

export const useSkillsManager = () => {
    const { t } = useTranslation()
    const { setLoading, setError, setSuccess } = useAppStore()
    const { tools, installedToolIds } = useToolStore()
    const { fetchSkills } = useSkillStore()

    const getOnboardingPlan = useCallback(async (): Promise<OnboardingPlan | null> => {
        try {
            return await invoke<OnboardingPlan>('get_onboarding_plan')
        } catch (error) {
            console.error('Failed to get onboarding plan:', error)
            return null
        }
    }, [])

    const syncToTools = useCallback(async (
        skill: { skill_id: string; central_path: string; name: string },
        targetToolIds: string[]
    ) => {
        const errors: { title: string; message: string }[] = []

        for (const toolId of targetToolIds) {
            const toolLabel = tools.find(t => t.id === toolId)?.label ?? toolId
            setLoading(true, t('actions.syncStep', {
                index: 1,
                total: targetToolIds.length,
                name: skill.name,
                tool: toolLabel
            }))

            try {
                await invoke('sync_skill_to_tool', {
                    sourcePath: skill.central_path,
                    skillId: skill.skill_id,
                    tool: toolId,
                    name: skill.name,
                    overwrite: true  // Allow replacing existing directories during import
                })
            } catch (err) {
                const raw = err instanceof Error ? err.message : String(err)
                errors.push({
                    title: t('errors.syncFailedTitle', { name: skill.name, tool: toolLabel }),
                    message: raw
                })
            }
        }
        return errors
    }, [tools, setLoading, t])

    const addLocalSkill = useCallback(async (
        path: string,
        name: string,
        syncTargets: Record<string, boolean>
    ) => {
        const basePath = path.trim()
        if (!basePath) return

        setLoading(true, t('actions.creatingLocalSkill'))
        try {
            const candidates = await invoke<any[]>('list_local_skills_cmd', { basePath })
            if (candidates.length === 0) throw new Error(t('errors.noSkillsFoundLocal'))

            if (candidates.length === 1 && candidates[0].valid) {
                const candidate = candidates[0]
                const finalName = name.trim() || candidate.name

                const created = await invoke<InstallResultDto>('install_local_selection', {
                    basePath,
                    subpath: candidate.subpath,
                    name: finalName
                })

                const targets = Object.keys(syncTargets).filter(id => syncTargets[id] && installedToolIds.includes(id))
                const errors = await syncToTools(created, targets)

                if (errors.length > 0) {
                    setError(errors[0].message)
                } else {
                    setSuccess(t('status.localSkillCreated'))
                    fetchSkills()
                }
                return { type: 'success' }
            } else {
                return { type: 'multiple', candidates, basePath }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
            return { type: 'error' }
        } finally {
            setLoading(false)
        }
    }, [t, setLoading, installedToolIds, syncToTools, setError, setSuccess, fetchSkills])

    const deleteSkill = useCallback(async (id: string) => {
        setLoading(true, t('actions.removing'))
        try {
            await invoke('delete_managed_skill', { skillId: id })
            setSuccess(t('status.skillRemoved'))
            fetchSkills()
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }, [t, setLoading, setSuccess, fetchSkills, setError])

    const updateSkill = useCallback(async (skillId: string, skillName: string) => {
        setLoading(true, t('actions.updating', { name: skillName }))
        try {
            await invoke('update_managed_skill', { skillId })
            setSuccess(t('status.skillUpdated'))
            fetchSkills()
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }, [t, setLoading, setSuccess, fetchSkills, setError])

    const toggleToolSync = useCallback(async (
        skill: { id: string; name: string; central_path: string },
        toolId: string,
        currentlySynced: boolean
    ) => {
        if (currentlySynced) {
            // Unsync: remove from tool
            setLoading(true, t('actions.unsyncing', { name: skill.name, tool: toolId }))
            try {
                await invoke('unsync_skill_from_tool', { skillId: skill.id, tool: toolId })
                setSuccess(t('status.syncDisabled'))
                fetchSkills()
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setLoading(false)
            }
        } else {
            // Sync: add to tool
            setLoading(true, t('actions.syncing', { name: skill.name, tool: toolId }))
            try {
                await invoke('sync_skill_to_tool', {
                    sourcePath: skill.central_path,
                    skillId: skill.id,
                    tool: toolId,
                    name: skill.name,
                    overwrite: false
                })
                setSuccess(t('status.syncEnabled'))
                fetchSkills()
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setLoading(false)
            }
        }
    }, [t, setLoading, setSuccess, fetchSkills, setError])

    /**
     * Sync or unsync a skill to ALL installed tools at once
     * @param skill - The skill to sync
     * @param sync - true to sync to all tools, false to unsync from all tools
     */
    const syncAllTools = useCallback(async (
        skill: { id: string; name: string; central_path: string; targets: { tool: string }[] },
        sync: boolean
    ) => {
        const action = sync ? t('actions.syncingAll') : t('actions.unsyncingAll')
        setLoading(true, action.replace('{{name}}', skill.name))

        let successCount = 0
        let errorCount = 0

        for (const toolId of installedToolIds) {
            const isSynced = skill.targets.some(t => t.tool === toolId)

            // Skip if already in desired state
            if (sync && isSynced) continue
            if (!sync && !isSynced) continue

            try {
                if (sync) {
                    await invoke('sync_skill_to_tool', {
                        sourcePath: skill.central_path,
                        skillId: skill.id,
                        tool: toolId,
                        name: skill.name,
                        overwrite: true
                    })
                } else {
                    await invoke('unsync_skill_from_tool', { skillId: skill.id, tool: toolId })
                }
                successCount++
            } catch {
                errorCount++
            }
        }

        if (errorCount > 0) {
            setError(t('status.syncPartialFailed', { success: successCount, error: errorCount }))
        } else if (successCount > 0) {
            setSuccess(sync ? t('status.syncAllCompleted') : t('status.unsyncAllCompleted'))
        } else {
            setSuccess(t('status.noChangesNeeded'))
        }

        fetchSkills()
        setLoading(false)
    }, [t, setLoading, setSuccess, setError, fetchSkills, installedToolIds])

    /**
     * Add a skill from a Git repository URL
     */
    const addGitSkill = useCallback(async (
        repoUrl: string,
        name: string,
        syncTargets: Record<string, boolean>
    ) => {
        const url = repoUrl.trim()
        if (!url) return { type: 'error' as const }

        setLoading(true, t('actions.creatingGitSkill'))
        try {
            // 1. First, list available skills in the repo
            const candidates = await invoke<any[]>('list_git_skills_cmd', { repoUrl: url })

            if (candidates.length === 0) {
                throw new Error(t('errors.noSkillsFoundGit'))
            }

            if (candidates.length === 1 && candidates[0].valid) {
                // Single valid skill - install directly
                const finalName = name.trim() || candidates[0].name

                const created = await invoke<InstallResultDto>('install_git', {
                    repoUrl: url,
                    name: finalName
                })

                // Sync to selected tools
                const targets = Object.keys(syncTargets).filter(id => syncTargets[id] && installedToolIds.includes(id))
                const errors = await syncToTools(created, targets)

                if (errors.length > 0) {
                    setError(errors[0].message)
                } else {
                    setSuccess(t('status.gitSkillCreated'))
                    fetchSkills()
                }
                return { type: 'success' as const }
            } else {
                // Multiple skills - need user selection
                return { type: 'multiple' as const, candidates, repoUrl: url }
            }

        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            // Handle multi-skill repo error
            if (msg.includes('MULTI_SKILLS')) {
                setError(t('errors.multiSkillsRepo'))
            } else {
                setError(msg)
            }
            return { type: 'error' as const }
        } finally {
            setLoading(false)
        }
    }, [t, setLoading, installedToolIds, syncToTools, setError, setSuccess, fetchSkills])

    return {
        addLocalSkill,
        addGitSkill,
        deleteSkill,
        updateSkill,
        toggleToolSync,
        syncAllTools,
        syncToTools,
        getOnboardingPlan
    }
}

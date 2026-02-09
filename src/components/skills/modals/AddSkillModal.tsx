import { memo, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'
import { useToolStore } from '../../../stores/useToolStore'
import { useAppStore } from '../../../stores/useAppStore'
import { useSkillStore } from '../../../stores/useSkillStore'
import { useSkillsManager } from '../../../hooks/useSkillsManager'
import GitPickModal from './GitPickModal'
import type { GitSkillCandidate } from '../types'

type AddSkillModalProps = {
  onClose: () => void
}

const AddSkillModal = ({ onClose }: AddSkillModalProps) => {
  const { t } = useTranslation()
  const { tools, installedToolIds, status: toolStatus } = useToolStore()
  const { isLoading, setLoading, setSuccess, setError } = useAppStore()
  const { skills, fetchSkills } = useSkillStore()
  const { addLocalSkill, syncToTools } = useSkillsManager()

  // Local state
  const [activeTab, setActiveTab] = useState<'local' | 'git'>('git')
  const [localPath, setLocalPath] = useState('')
  const [localName, setLocalName] = useState('')
  const [gitUrl, setGitUrl] = useState('')
  const [gitName, setGitName] = useState('')
  const [syncTargets, setSyncTargets] = useState<Record<string, boolean>>({})

  // Git pick modal state
  const [showGitPick, setShowGitPick] = useState(false)
  const [gitCandidates, setGitCandidates] = useState<GitSkillCandidate[]>([])
  const [gitCandidateSelected, setGitCandidateSelected] = useState<Record<string, boolean>>({})
  const [pendingRepoUrl, setPendingRepoUrl] = useState('')

  // Initialize syncTargets when tools load
  useEffect(() => {
    if (Object.keys(syncTargets).length === 0 && installedToolIds.length > 0) {
      const initial: Record<string, boolean> = {}
      installedToolIds.forEach((id: string) => { initial[id] = true })
      setSyncTargets(initial)
    }
  }, [installedToolIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper for picking path
  const handlePickLocalPath = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog')
      const selected = await open({
        directory: true,
        multiple: false,
        title: t('selectLocalFolder'),
      })
      if (selected && !Array.isArray(selected)) {
        setLocalPath(selected)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSyncTargetChange = (toolId: string, checked: boolean) => {
    setSyncTargets(prev => ({ ...prev, [toolId]: checked }))
  }

  const handleSubmit = async () => {
    if (activeTab === 'local') {
      await addLocalSkill(localPath, localName, syncTargets)
    } else {
      // Git tab - list skills first
      const url = gitUrl.trim()
      if (!url) return

      setLoading(true, t('actions.creatingGitSkill'))
      try {
        const candidates = await invoke<GitSkillCandidate[]>('list_git_skills_cmd', { repoUrl: url })

        if (candidates.length === 0) {
          setError(t('errors.noSkillsFoundGit'))
          return
        }

        if (candidates.length === 1) {
          // Single skill - check if already exists
          const existingNames = new Set(skills.map(s => s.name.toLowerCase()))
          if (existingNames.has(candidates[0].name.toLowerCase())) {
            setError(t('errors.allSkillsExist'))
            return
          }
          // Install directly
          await installGitSkills(url, [candidates[0]])
        } else {
          // Multiple skills - filter out existing ones and show pick modal
          const existingNames = new Set(skills.map(s => s.name.toLowerCase()))
          const newCandidates = candidates.filter(c => !existingNames.has(c.name.toLowerCase()))

          if (newCandidates.length === 0) {
            setError(t('errors.allSkillsExist'))
            return
          }

          setGitCandidates(newCandidates)
          const selected: Record<string, boolean> = {}
          newCandidates.forEach(c => { selected[c.subpath] = true })
          setGitCandidateSelected(selected)
          setPendingRepoUrl(url)
          setShowGitPick(true)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('MULTI_SKILLS')) {
          setError(t('errors.multiSkillsRepo'))
        } else {
          setError(msg)
        }
      } finally {
        setLoading(false)
      }
    }
  }

  const installGitSkills = useCallback(async (repoUrl: string, skillsToInstall: GitSkillCandidate[]) => {
    setLoading(true, t('actions.creatingGitSkill'))
    try {
      for (let i = 0; i < skillsToInstall.length; i++) {
        const skill = skillsToInstall[i]
        setLoading(true, t('actions.importStep', { index: i + 1, total: skillsToInstall.length, name: skill.name }))

        // When installing multiple skills, use each skill's own name
        // Only use custom gitName when installing a single skill
        const finalName = skillsToInstall.length === 1 && gitName.trim() ? gitName.trim() : skill.name

        // Install using the selection command
        const result = await invoke<any>('install_git_selection', {
          repoUrl,
          subpath: skill.subpath,
          name: finalName
        })

        // Sync to selected tools
        const targets = Object.keys(syncTargets).filter(id => syncTargets[id] && installedToolIds.includes(id))
        await syncToTools(result, targets)
      }

      setSuccess(t('status.gitSkillCreated'))
      fetchSkills()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
      setShowGitPick(false)
    }
  }, [t, setLoading, setSuccess, setError, fetchSkills, syncTargets, installedToolIds, syncToTools, gitName, onClose])

  const handleGitPickInstall = useCallback(() => {
    const selected = gitCandidates.filter(c => gitCandidateSelected[c.subpath])
    if (selected.length === 0) {
      setError(t('errors.selectAtLeastOneSkill'))
      return
    }
    installGitSkills(pendingRepoUrl, selected)
  }, [gitCandidates, gitCandidateSelected, pendingRepoUrl, installGitSkills, setError, t])

  // We can close if not loading
  const canClose = !isLoading

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={() => (canClose ? onClose() : null)}
      >
        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">{t('addSkillTitle')}</div>
            <button
              className="modal-close"
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              disabled={!canClose}
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="tabs">
              <button
                className={`tab-item${activeTab === 'local' ? ' active' : ''}`}
                type="button"
                onClick={() => setActiveTab('local')}
              >
                {t('localTab')}
              </button>
              <button
                className={`tab-item${activeTab === 'git' ? ' active' : ''}`}
                type="button"
                onClick={() => setActiveTab('git')}
              >
                {t('gitTab')}
              </button>
            </div>

            {activeTab === 'local' ? (
              <>
                <div className="form-group">
                  <label className="label">{t('localFolder')}</label>
                  <div className="input-row">
                    <input
                      className="input"
                      placeholder={t('localPathPlaceholder')}
                      value={localPath}
                      onChange={(e) => setLocalPath(e.target.value)}
                    />
                    <button
                      className="btn btn-secondary input-action"
                      type="button"
                      onClick={handlePickLocalPath}
                      disabled={!canClose}
                    >
                      {t('browse')}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">{t('optionalNamePlaceholder')}</label>
                  <input
                    className="input"
                    placeholder={t('optionalNamePlaceholder')}
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="label">{t('repositoryUrl')}</label>
                  <input
                    className="input"
                    placeholder={t('gitUrlPlaceholder')}
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">{t('optionalNamePlaceholder')}</label>
                  <input
                    className="input"
                    placeholder={t('optionalNamePlaceholder')}
                    value={gitName}
                    onChange={(e) => setGitName(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="label">{t('installToTools')}</label>
              {toolStatus ? (
                <div className="tool-matrix">
                  {tools.filter(t => installedToolIds.includes(t.id)).map((tool: any) => (
                    <label
                      key={tool.id}
                      className={`tool-pill-toggle${syncTargets[tool.id] ? ' active' : ''
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(syncTargets[tool.id])}
                        onChange={(e) =>
                          handleSyncTargetChange(tool.id, e.target.checked)
                        }
                      />
                      {syncTargets[tool.id] ? <span className="status-badge" /> : null}
                      {tool.label}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="helper-text">{t('detectingTools')}</div>
              )}
              <div className="helper-text">{t('syncAfterCreate')}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={!canClose}
            >
              {t('cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {activeTab === 'local' ? t('create') : t('install')}
            </button>
          </div>
        </div>
      </div>

      {/* Git Pick Modal for multi-skill repos */}
      <GitPickModal
        open={showGitPick}
        loading={isLoading}
        gitCandidates={gitCandidates}
        gitCandidateSelected={gitCandidateSelected}
        onRequestClose={() => setShowGitPick(false)}
        onCancel={() => setShowGitPick(false)}
        onToggleAll={(checked) => {
          const updated: Record<string, boolean> = {}
          gitCandidates.forEach(c => { updated[c.subpath] = checked })
          setGitCandidateSelected(updated)
        }}
        onToggleCandidate={(subpath, checked) => {
          setGitCandidateSelected(prev => ({ ...prev, [subpath]: checked }))
        }}
        onInstall={handleGitPickInstall}
        t={t}
      />
    </>
  )
}

export default memo(AddSkillModal)

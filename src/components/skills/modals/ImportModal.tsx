import { memo, useState, useEffect } from 'react'
import { Download, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '../../../stores/useAppStore'
import { useSkillsManager } from '../../../hooks/useSkillsManager'
import type { OnboardingPlan } from '../types'

type ImportModalProps = {
  onClose: () => void
  onFinish: () => void
}

const ImportModal = ({ onClose, onFinish }: ImportModalProps) => {
  const { t } = useTranslation()
  const { isLoading, setLoading, setError, setSuccess } = useAppStore()
  // Now syncToTools should be available
  const { syncToTools } = useSkillsManager()

  const [plan, setPlan] = useState<OnboardingPlan | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [variantChoice, setVariantChoice] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Load plan on mount
    const load = async () => {
      setLoading(true)
      try {
        const result = await invoke<OnboardingPlan>('get_onboarding_plan')
        setPlan(result)

        const defaultSelected: Record<string, boolean> = {}
        const defaultChoice: Record<string, string> = {}
        result.groups.forEach((group: any) => {
          defaultSelected[group.name] = true
          const first = group.variants[0]
          if (first) {
            defaultChoice[group.name] = first.path
          }
        })
        setSelected(defaultSelected)
        setVariantChoice(defaultChoice)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAll = (checked: boolean) => {
    if (!plan) return
    const next: Record<string, boolean> = {}
    plan.groups.forEach((group: any) => {
      next[group.name] = checked
    })
    setSelected(next)
  }

  const handleToggleGroup = (groupName: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [groupName]: checked }))
  }

  const handleSelectVariant = (groupName: string, path: string) => {
    setVariantChoice(prev => ({ ...prev, [groupName]: path }))
  }

  const handleImport = async () => {
    if (!plan) return
    setLoading(true)

    try {
      const selectedGroups = plan.groups.filter((g: any) => selected[g.name])
      const total = selectedGroups.length
      let current = 0

      for (const group of selectedGroups) {
        current++
        const selectedPath = variantChoice[group.name]
        const variant = group.variants.find((v: any) => v.path === selectedPath)

        if (!selectedPath || !variant) continue

        // Extract base path and subpath
        // For local detection, usually variant.path is the full path.
        // We need to verify how list_local_skills worked or just use install_local directly if it's a root.
        // But install_local_selection logic expects basePath + subpath.
        // For simplicity, let's treat the variant path as the full path to the skill.
        // We can use `install_local` (cmd: install_local) which takes sourcePath.

        const sourcePath = selectedPath

        setLoading(true, t('actions.importingStep', {
          current,
          total,
          name: group.name
        }))

        // 1. Install/Import the skill
        // We use install_local command.
        const installRes = await invoke<any>('install_local', {
          sourcePath,
          name: group.name
        })

        // 2. Sync to other tools if needed
        // If the variant was found in tool A, B, C, we might want to sync back to them
        // to ensure they are linked as "managed" targets.
        // The group.variants tells us where it was found.
        const toolsToSync = group.variants
          .map((v: any) => v.tool)
        // Filter out tools that are not installed/enabled in our store if we want to be strict,
        // but usually we want to adopt them all.

        await syncToTools({
          skill_id: installRes.skill_id,
          central_path: installRes.central_path,
          name: installRes.name
        }, toolsToSync)
      }

      setSuccess(t('status.importCompleted'))
      onFinish()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!plan) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-lg modal-discovered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">{t('importTitle')}</div>
          <button
            className="modal-close"
            type="button"
            onClick={onClose}
            aria-label={t('close')}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="import-summary">
            <div>{t('importSummary')}</div>
            <div className="import-metrics">
              <span>{t('toolsScanned', { count: plan.total_tools_scanned })}</span>
              <span>{t('skillsFound', { count: plan.total_skills_found })}</span>
            </div>
          </div>
          <div className="sync-row">
            <label className="inline-checkbox">
              <input
                type="checkbox"
                checked={
                  plan.groups.length > 0 &&
                  plan.groups.every((group: any) => selected[group.name])
                }
                onChange={(event) => handleToggleAll(event.target.checked)}
              />
              {t('selectAll')}
            </label>
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder={t('searchPlaceholder') || '搜索 Skills...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="groups discovered-list">
            {plan.groups
              .filter((group: any) =>
                searchTerm === '' ||
                group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.variants.some((v: any) =>
                  v.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  v.tool.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .map((group: any) => (
                <div className="group-card" key={group.name}>
                  <div className="group-title">
                    <label className="group-select">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[group.name])}
                        onChange={(event) =>
                          handleToggleGroup(group.name, event.target.checked)
                        }
                      />
                      <span>{group.name}</span>
                    </label>
                    {group.has_conflict ? (
                      <span className="badge danger">{t('conflict')}</span>
                    ) : (
                      <span className="badge">{t('consistent')}</span>
                    )}
                  </div>
                  <div className="group-variants">
                    {group.variants.map((variant: any) => (
                      <div
                        className="variant-row"
                        key={`${group.name}-${variant.tool}-${variant.path}`}
                      >
                        <div className="variant-info">
                          <label className="variant-label">
                            <input
                              type="radio"
                              checked={variantChoice[group.name] === variant.path}
                              onChange={() => handleSelectVariant(group.name, variant.path)}
                            // disabled={!group.has_conflict} // User prefers interaction
                            />
                            <span className="variant-path" title={variant.path}>{variant.path}</span>
                            <span className="variant-tool">{variant.tool}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleImport}
            disabled={isLoading}
          >
            <Download size={14} />
            {t('importAndSync')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(ImportModal)

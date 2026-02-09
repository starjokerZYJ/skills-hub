import { memo } from 'react'
import { Box, Copy, Folder, Github, RefreshCw, Trash2, Zap, ZapOff } from 'lucide-react'
import { toast } from 'sonner'
import type { TFunction } from 'i18next'
import type { ManagedSkill, ToolOption } from './types'

type GithubInfo = {
  label: string
  href: string
}

type SkillCardProps = {
  skill: ManagedSkill
  installedTools: ToolOption[]
  loading: boolean
  getGithubInfo: (url: string | null | undefined) => GithubInfo | null
  getSkillSourceLabel: (skill: ManagedSkill) => string
  formatRelative: (ms: number | null | undefined) => string
  onUpdate: (skill: ManagedSkill) => void
  onDelete: (skillId: string) => void
  onToggleTool: (skill: ManagedSkill, toolId: string) => void
  onSyncAll: (skill: ManagedSkill, sync: boolean) => void
  onClick?: () => void
  t: TFunction
}

const SkillCard = ({
  skill,
  installedTools,
  loading,
  getGithubInfo,
  getSkillSourceLabel,
  formatRelative,
  onUpdate,
  onDelete,
  onToggleTool,
  onSyncAll,
  onClick,
  t,
}: SkillCardProps) => {
  const typeKey = skill.source_type.toLowerCase()
  const iconNode = typeKey.includes('git') ? (
    <Github size={20} />
  ) : typeKey.includes('local') ? (
    <Folder size={20} />
  ) : (
    <Box size={20} />
  )
  const github = getGithubInfo(skill.source_ref)
  const copyValue = (github?.href ?? skill.source_ref ?? '').trim()

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!copyValue) return
    try {
      await navigator.clipboard.writeText(copyValue)
      toast.success(t('copied'))
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  return (
    <div className="skill-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Top row: Icon + Name/Meta */}
      <div className="skill-top-row">
        <div className="skill-icon">{iconNode}</div>
        <div className="skill-main">
          <div className="skill-header-row">
            <div className="skill-name">{skill.name}</div>
          </div>

          {skill.metadata?.description && (
            <div className="skill-description" title={skill.metadata.description}>
              {skill.metadata.description}
            </div>
          )}
          <div className="skill-meta-row">
            {github ? (
              <div className="skill-source">
                <button
                  className="repo-pill copyable"
                  type="button"
                  title={t('copy')}
                  aria-label={t('copy')}
                  onClick={(e) => void handleCopy(e)}
                  disabled={!copyValue}
                >
                  {github.label}
                  <span className="copy-icon" aria-hidden="true">
                    <Copy size={12} />
                  </span>
                </button>
              </div>
            ) : (
              <div className="skill-source">
                <button
                  className="repo-pill copyable"
                  type="button"
                  title={t('copy')}
                  aria-label={t('copy')}
                  onClick={(e) => void handleCopy(e)}
                  disabled={!copyValue}
                >
                  <span className="mono">{getSkillSourceLabel(skill)}</span>
                  <span className="copy-icon" aria-hidden="true">
                    <Copy size={12} />
                  </span>
                </button>
              </div>
            )}
            <div className="skill-source time">
              <span className="dot">•</span>
              {formatRelative(skill.updated_at)}
            </div>
          </div>
        </div>
      </div>

      {skill.metadata?.tags && skill.metadata.tags.length > 0 && (
        <div className="skill-tags">
          {skill.metadata.tags.map((tag) => (
            <span key={tag} className="tag-pill">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Tool sync matrix */}
      <div className="tool-matrix">
        {installedTools.map((tool) => {
          const target = skill.targets.find((t) => t.tool === tool.id)
          const synced = Boolean(target)
          const state = synced ? 'active' : 'inactive'
          return (
            <button
              key={`${skill.id}-${tool.id}`}
              type="button"
              className={`tool-pill ${state}`}
              title={
                synced
                  ? `${tool.label} (${target?.mode ?? t('unknown')})`
                  : tool.label
              }
              onClick={(e) => { e.stopPropagation(); void onToggleTool(skill, tool.id) }}
            >
              {synced ? <span className="status-badge" /> : null}
              {tool.label}
            </button>
          )
        })}
      </div>

      {/* Bottom actions row */}
      <div className="skill-actions-row">
        <div className="sync-all-actions">
          {installedTools.some(tool => !skill.targets.some(t => t.tool === tool.id)) && (
            <button
              type="button"
              className="sync-all-btn sync"
              onClick={(e) => { e.stopPropagation(); onSyncAll(skill, true) }}
              disabled={loading}
              title={t('syncAllToTools')}
            >
              <Zap size={14} />
              {t('syncAll')}
            </button>
          )}
          {skill.targets.length > 0 && (
            <button
              type="button"
              className="sync-all-btn unsync"
              onClick={(e) => { e.stopPropagation(); onSyncAll(skill, false) }}
              disabled={loading}
              title={t('unsyncAllFromTools')}
            >
              <ZapOff size={14} />
              {t('unsyncAll')}
            </button>
          )}
        </div>
        <div className="skill-actions-col">
          <button
            className="card-btn primary-action"
            type="button"
            onClick={(e) => { e.stopPropagation(); onUpdate(skill) }}
            disabled={loading}
            aria-label={t('update')}
          >
            <RefreshCw size={16} />
          </button>
          <button
            className="card-btn danger-action"
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(skill.id) }}
            disabled={loading}
            aria-label={t('remove')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(SkillCard)

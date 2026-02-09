import { useState, useEffect } from 'react'
import { X, Github, Folder, Box, ExternalLink, Copy, Check, FileText } from 'lucide-react'
import type { TFunction } from 'i18next'
import type { ManagedSkill, ToolOption } from '../types'
import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import './SkillDetailModal.css'

type SkillDetailModalProps = {
    skill: ManagedSkill
    installedTools: ToolOption[]
    loading: boolean
    onClose: () => void
    onToggleTool: (skill: ManagedSkill, toolId: string) => void
    t: TFunction
}

const SkillDetailModal = ({
    skill,
    installedTools,
    loading,
    onClose,
    onToggleTool,
    t,
}: SkillDetailModalProps) => {
    const [copied, setCopied] = useState(false)
    const [skillContent, setSkillContent] = useState<string>('')
    const [contentLoading, setContentLoading] = useState(true)

    const isGit = skill.source_type.toLowerCase().includes('git')
    const isLocal = skill.source_type.toLowerCase().includes('local')

    const sourceIcon = isGit ? <Github size={18} /> : isLocal ? <Folder size={18} /> : <Box size={18} />

    // Load SKILL.md content on mount
    useEffect(() => {
        const loadContent = async () => {
            if (!skill.central_path) {
                setContentLoading(false)
                return
            }
            try {
                const content = await invoke<string>('read_skill_content', {
                    centralPath: skill.central_path
                })
                setSkillContent(content)
            } catch (err) {
                console.error('Failed to load skill content:', err)
            } finally {
                setContentLoading(false)
            }
        }
        loadContent()
    }, [skill.central_path])

    const handleCopyPath = async () => {
        const path = skill.central_path || skill.source_ref || ''
        if (!path) return
        try {
            await navigator.clipboard.writeText(path)
            setCopied(true)
            toast.success(t('copied'))
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error(t('copyFailed'))
        }
    }

    const formatDate = (timestamp: number | null | undefined) => {
        if (!timestamp) return '—'
        return new Date(timestamp).toLocaleString()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="skill-detail-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="detail-header">
                    <div className="detail-icon">{sourceIcon}</div>
                    <div className="detail-title-area">
                        <h2 className="detail-title">{skill.name}</h2>
                        <span className="detail-source-type">{skill.source_type}</span>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label={t('close')}>
                        <X size={20} />
                    </button>
                </div>

                {/* Two-column layout */}
                <div className="detail-body">
                    {/* Left: Basic Info */}
                    <div className="detail-sidebar">
                        <div className="sidebar-section">
                            <h3 className="section-title">{t('skillDetail.info')}</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">{t('skillDetail.path')}</span>
                                    <div className="info-value path-value">
                                        <code>{skill.central_path || '—'}</code>
                                        <button className="copy-btn" onClick={handleCopyPath} title={t('copy')}>
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                                {skill.source_ref && (
                                    <div className="info-item">
                                        <span className="info-label">{t('skillDetail.source')}</span>
                                        <div className="info-value">
                                            {isGit ? (
                                                <a href={skill.source_ref} target="_blank" rel="noopener noreferrer" className="source-link">
                                                    {skill.source_ref}
                                                    <ExternalLink size={12} />
                                                </a>
                                            ) : (
                                                <code>{skill.source_ref}</code>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="info-item">
                                    <span className="info-label">{t('skillDetail.updated')}</span>
                                    <span className="info-value">{formatDate(skill.updated_at)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">{t('skillDetail.created')}</span>
                                    <span className="info-value">{formatDate(skill.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        {skill.metadata?.tags && skill.metadata.tags.length > 0 && (
                            <div className="sidebar-section">
                                <h3 className="section-title">{t('skillDetail.tags')}</h3>
                                <div className="tags-list">
                                    {skill.metadata.tags.map((tag) => (
                                        <span key={tag} className="tag-pill">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="sidebar-section">
                            <h3 className="section-title">{t('skillDetail.syncedTools')}</h3>
                            <div className="tools-grid">
                                {installedTools.map((tool) => {
                                    const target = skill.targets.find((t) => t.tool === tool.id)
                                    const synced = Boolean(target)
                                    return (
                                        <button
                                            key={tool.id}
                                            className={`tool-item ${synced ? 'synced' : ''}`}
                                            onClick={() => onToggleTool(skill, tool.id)}
                                            disabled={loading}
                                        >
                                            <span className="tool-name">{tool.label}</span>
                                            {synced && <span className="sync-mode">{target?.mode}</span>}
                                            <span className={`sync-status ${synced ? 'active' : 'inactive'}`}>
                                                {synced ? t('synced') : t('notSynced')}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: SKILL.md Content */}
                    <div className="detail-content">
                        <div className="content-header">
                            <FileText size={16} />
                            <span>SKILL.md</span>
                        </div>
                        <div className="markdown-content">
                            {contentLoading ? (
                                <div className="content-loading">{t('loading')}...</div>
                            ) : skillContent ? (
                                <ReactMarkdown>{skillContent}</ReactMarkdown>
                            ) : (
                                <div className="content-empty">{t('skillDetail.noContent')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SkillDetailModal


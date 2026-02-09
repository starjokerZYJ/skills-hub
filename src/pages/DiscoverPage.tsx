import { useState, useCallback } from 'react'
import { Search, Download, ExternalLink, Loader2, Package } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { RegistrySkill } from '../components/skills/types'
import './DiscoverPage.css'

const DiscoverPage = () => {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<RegistrySkill[]>([])
    const [loading, setLoading] = useState(false)
    const [installing, setInstalling] = useState<string | null>(null)

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return
        setLoading(true)
        setResults([])
        try {
            const skills = await invoke<RegistrySkill[]>('search_skills_registry', {
                query: query.trim()
            })
            setResults(skills)
            if (skills.length === 0) {
                toast.info(t('discover.noResults'))
            }
        } catch (err) {
            console.error('Search failed:', err)
            toast.error(t('discover.searchFailed'))
        } finally {
            setLoading(false)
        }
    }, [query, t])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const handleInstall = async (skill: RegistrySkill) => {
        const packageName = `${skill.owner}/${skill.repo}@${skill.name}`
        setInstalling(packageName)
        try {
            // Use npx skills add which knows the correct repo structure
            await invoke('install_from_registry', {
                package: packageName
            })
            toast.success(t('discover.importSuccess', { name: skill.name }))
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err)
            console.error('Install failed:', errMsg)
            toast.error(t('discover.importFailed'))
        } finally {
            setInstalling(null)
        }
    }

    return (
        <div className="discover-page">
            {/* Search Bar */}
            <div className="discover-search">
                <div className="search-input-wrap">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t('discover.placeholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                >
                    {loading ? <Loader2 size={16} className="spinner" /> : <Search size={16} />}
                    {t('discover.search')}
                </button>
            </div>

            {/* Powered by skills.sh */}
            <div className="discover-powered">
                <span>{t('discover.poweredBy')}</span>
                <a href="https://skills.sh" target="_blank" rel="noopener noreferrer">
                    skills.sh
                </a>
            </div>

            {/* Results */}
            <div className="discover-results">
                {loading ? (
                    <div className="discover-loading">
                        <Loader2 size={24} className="spinner" />
                        <span>{t('discover.searching')}</span>
                    </div>
                ) : results.length === 0 ? (
                    <div className="discover-empty">
                        <Package size={48} />
                        <p>{t('discover.emptyHint')}</p>
                    </div>
                ) : (
                    <div className="registry-grid">
                        {results.map((skill) => (
                            <div key={`${skill.owner}/${skill.repo}/${skill.name}`} className="registry-card">
                                <div className="registry-header">
                                    <div className="registry-name">{skill.name}</div>
                                    <a
                                        href={skill.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="registry-link"
                                        title={t('discover.viewOnSkillsSh')}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                                <div className="registry-repo">
                                    {skill.owner}/{skill.repo}
                                </div>
                                <div className="registry-cmd">
                                    <code>{skill.install_cmd}</code>
                                </div>
                                <button
                                    className="btn btn-secondary registry-install-btn"
                                    onClick={() => handleInstall(skill)}
                                    disabled={installing !== null}
                                >
                                    {installing === `${skill.owner}/${skill.repo}@${skill.name}` ? (
                                        <Loader2 size={14} className="spinner" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                    {t('discover.install')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default DiscoverPage

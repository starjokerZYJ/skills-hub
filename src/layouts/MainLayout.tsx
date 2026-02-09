import { Outlet } from 'react-router-dom'
import Header from '../components/skills/Header'
import { useToolStore } from '../stores/useToolStore'
import { useEffect } from 'react'

const MainLayout = () => {
    const { fetchStatus } = useToolStore()

    useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    return (
        <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Header />
            <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout

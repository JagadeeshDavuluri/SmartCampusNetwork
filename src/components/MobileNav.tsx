'use client'

import { BarChart3, DoorOpen, Users, Shield, AlertTriangle, Scan, Bell, Map, Cpu } from 'lucide-react'

interface MobileNavProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

const tabs = [
    { id: 'dashboard', label: 'Home', icon: Shield },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'gates', label: 'Gates', icon: DoorOpen },
    { id: 'access-control', label: 'Scan', icon: Scan },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'iot', label: 'IoT', icon: Cpu },
    { id: 'map', label: 'Map', icon: Map },
]

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
            <div className="flex items-center justify-around px-1 py-1">
                {tabs.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-0 flex-1 ${isActive
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                            <span className={`text-[10px] leading-none truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}

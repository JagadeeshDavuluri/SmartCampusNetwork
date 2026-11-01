'use client'

import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Shield, Bell, RefreshCw, LogOut, Search, Scan, DoorOpen, FileText, Volume2, VolumeX, Inbox,
} from 'lucide-react'
import { useClickSound } from '@/hooks/use-click-sound'

interface AdminUser { name: string; email: string; role: string }

interface SolvikShellProps {
  activeTab: string
  onTabChange: (tab: string) => void
  adminUser: AdminUser | null
  alertCount: number
  onRefresh: () => void
  onLogout: () => void
  onSearch?: (query: string) => void
  children: ReactNode
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'gates', label: 'Gates' },
  { id: 'access-control', label: 'Access Control' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'iot', label: 'IoT' },
  { id: 'map', label: 'Map' },
  { id: 'reports', label: 'Reports' },
]

const base = 'grid place-items-center rounded-full text-muted-foreground transition-colors'
const hov = 'hover:bg-white/10 hover:text-foreground'
const railBtn = `${base} ${hov} size-10`
const topBtn = `solvik-bar ${base} ${hov} size-[42px]`

export function SolvikShell({
  activeTab, onTabChange, adminUser, alertCount, onRefresh, onLogout, children,
}: SolvikShellProps) {
  const reduce = useReducedMotion()
  const { click, muted, toggle } = useClickSound()
  const listRef = useRef<HTMLDivElement>(null)
  const initials = (adminUser?.name || 'A').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()

  const go = (id: string) => {
    if (id === activeTab) return
    click()
    onTabChange(id)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const i = TABS.findIndex(t => t.id === activeTab)
    const next = TABS[(i + dir + TABS.length) % TABS.length]
    go(next.id)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next.id}"]`)?.focus()
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 pb-2 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] md:px-6">
        <div className="flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
          <span className="grid size-[34px] place-items-center rounded-[11px] bg-lime text-[#14160f]">
            <Shield className="size-[18px]" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">smart campus</span>
        </div>

        <div
          ref={listRef}
          role="tablist"
          aria-label="Dashboard sections"
          onKeyDown={onKeyDown}
          className="solvik-bar hidden max-w-[calc(100vw-22rem)] gap-0.5 overflow-x-auto p-1 [scrollbar-width:none] md:flex"
        >
          {TABS.map(t => {
            const active = t.id === activeTab
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                data-tab={t.id}
                aria-selected={active}
                aria-controls="solvik-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => go(t.id)}
                className={`relative min-h-10 whitespace-nowrap rounded-full px-4 text-[13px] transition-colors ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="solvik-tab-highlight"
                    className="absolute inset-0 rounded-full bg-white/15"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go('reports')} aria-label="Reports" className={topBtn}>
            <Inbox className="size-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go('alerts')}
            aria-label={`Alerts, ${alertCount} active`}
            className={`${topBtn} relative`}
          >
            <Bell className="size-[18px]" aria-hidden="true" />
            {alertCount > 0 && <span className="absolute right-2.5 top-2.5 size-[7px] rounded-full bg-coral" aria-hidden="true" />}
          </button>
          <span
            title={`${adminUser?.name ?? ''} ${adminUser?.email ?? ''}`.trim()}
            className="grid size-[42px] place-items-center rounded-full bg-[#e9f3c2] text-xs font-semibold text-[#1b2108]"
          >
            {initials}
          </span>
        </div>
      </header>

      {/* Floating icon rail */}
      <aside
        aria-label="Quick actions"
        className="solvik-bar fixed left-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-0.5 p-2 md:flex"
      >
        <button type="button" onClick={() => go('users')} aria-label="Search users" title="Search users" className={railBtn}><Search className="size-[18px]" /></button>
        <button type="button" onClick={() => go('access-control')} aria-label="Scan access" title="Scan access" className={railBtn}><Scan className="size-[18px]" /></button>
        <button type="button" onClick={() => go('gates')} aria-label="Gates" title="Gates" className={railBtn}><DoorOpen className="size-[18px]" /></button>
        <button type="button" onClick={() => go('reports')} aria-label="Reports" title="Reports" className={railBtn}><FileText className="size-[18px]" /></button>
        <button type="button" onClick={() => { click(); onRefresh() }} aria-label="Refresh data" title="Refresh data" className={railBtn}><RefreshCw className="size-[18px]" /></button>
        <hr className="mx-auto my-1.5 w-5 border-white/10" />
        <button type="button" onClick={onLogout} aria-label="Logout" title="Logout" className={`${base} size-10 hover:bg-white/10 hover:text-destructive`}><LogOut className="size-[18px]" /></button>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!muted}
          aria-label={muted ? 'Click sounds off' : 'Click sounds on'}
          title="Click sounds"
          className={railBtn}
        >
          {muted ? <VolumeX className="size-[18px]" /> : <Volume2 className="size-[18px]" />}
        </button>
      </aside>

      {/* Blur-fade view transition on every tab change */}
      <main id="solvik-panel" role="tabpanel" className="mx-auto max-w-[1560px] px-4 pb-16 pt-20 md:pb-10 md:pl-24 md:pr-6 md:pt-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={reduce ? false : { opacity: 0, filter: 'blur(10px)', y: 10 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0, transitionEnd: { filter: 'none' } }}
            exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: reduce ? 0 : 0.18 } }}
            transition={{ duration: reduce ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

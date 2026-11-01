'use client'

import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowUpRight, DoorOpen, Gauge, MoreHorizontal, ShieldCheck, Users } from 'lucide-react'

gsap.registerPlugin(useGSAP)

interface Stats {
  totalUsers: number; activeUsers: number; totalGates: number; onlineGates: number
  todayAccessLogs: number; grantedToday: number; deniedToday: number; activeAlerts: number
  usersByType: { students: number; staff: number; faculty: number; visitors: number }
}
interface Gate {
  id: string; name: string; location: string; status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'LOCKED'
  _count?: { accessLogs: number }
}
interface HourlyData { hour: number; entries: number; exits: number }
interface Props { stats: Stats | null; gates: Gate[]; hourlyData: HourlyData[]; onNavigate: (tab: string) => void }

type Mode = 'total' | 'entries' | 'exits'

const STATUS: Record<Gate['status'], string> = {
  ONLINE: 'text-lime', OFFLINE: 'text-destructive', MAINTENANCE: 'text-amber-300', LOCKED: 'text-muted-foreground',
}
const MIX = [
  { key: 'students', label: 'Students', color: 'var(--chart-1)' },
  { key: 'staff', label: 'Staff', color: 'var(--chart-3)' },
  { key: 'faculty', label: 'Faculty', color: 'var(--chart-5)' },
  { key: 'visitors', label: 'Visitors', color: 'var(--chart-2)' },
] as const

/** Counter that ticks up on load (and from its last value on refresh). Respects reduced motion. */
function Count({ to, from = 0, prefix = '', suffix = '' }: { to: number; from?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const last = useRef<number | null>(null)
  const fmt = (v: number) => prefix + Math.round(v).toLocaleString('en-US') + suffix
  useGSAP(() => {
    const el = ref.current
    if (!el) return
    const o = { v: last.current ?? from }
    const write = () => { el.textContent = fmt(o.v) }
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      write()
      gsap.to(o, { v: to, duration: 1.5, ease: 'power2.out', onUpdate: write, onComplete: () => { last.current = to } })
    })
    mm.add('(prefers-reduced-motion: reduce)', () => { o.v = to; write(); last.current = to })
  }, { dependencies: [to, from] })
  return <span ref={ref}>{fmt(from)}</span>
}

function curve(p: [number, number][]) {
  if (p.length < 2) return `M${p[0][0]},${p[0][1]}`
  let d = `M${p[0][0]},${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c
    d += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`
  }
  return d
}

const niceMax = (m: number) => {
  if (m <= 4) return 4
  const p = Math.pow(10, Math.floor(Math.log10(m)))
  return Math.ceil(m / p) * p
}

export function SolvikOverview({ stats, gates, hourlyData, onNavigate }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('total')
  const [hover, setHover] = useState<number | null>(null)

  const data = useMemo(() => hourlyData.map(d => ({ ...d, total: d.entries + d.exits })), [hourlyData])
  const total = data.reduce((s, d) => s + d.total, 0)
  const peak = data.reduce((b, d) => (d.total > (b?.total ?? -1) ? d : b), data[0])

  const W = 800, H = 260, X0 = 52, X1 = 780, BASE = 230, TOP = 20
  const yMax = niceMax(Math.max(1, ...data.map(d => d[mode])))
  const pts: [number, number][] = data.map((d, i) => [
    data.length > 1 ? X0 + (i * (X1 - X0)) / (data.length - 1) : (X0 + X1) / 2,
    BASE - (d[mode] / yMax) * (BASE - TOP),
  ])
  const line = pts.length ? curve(pts) : ''
  const tickEvery = Math.max(1, Math.ceil(data.length / 8))

  const topGates = useMemo(
    () => [...gates].sort((a, b) => (b._count?.accessLogs ?? 0) - (a._count?.accessLogs ?? 0)).slice(0, 4),
    [gates]
  )

  const granted = stats?.grantedToday || 0
  const denied = stats?.deniedToday || 0
  const events = stats?.todayAccessLogs || 0
  const grantRate = events ? Math.round((granted / events) * 100) : 0
  const deniedRate = events ? Math.round((denied / events) * 100) : 0
  const uptime = stats?.totalGates ? Math.round((stats.onlineGates / stats.totalGates) * 100) : 0
  const users = stats?.totalUsers || 0

  // Entrance + stroke draw-on (re-draws when the series changes). Honors reduced motion.
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-reveal]', { y: 22, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, clearProps: 'transform,opacity' })
      gsap.fromTo('[data-line]', { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' })
      gsap.from('[data-fill]', { opacity: 0, duration: 1.4, delay: 0.5 })
    })
  }, { scope: root, dependencies: [mode], revertOnUpdate: true })

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (data.length < 2) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((x - X0) / (X1 - X0)) * (data.length - 1))
    setHover(Math.min(data.length - 1, Math.max(0, i)))
  }

  const stat = (icon: ReactNode, value: ReactNode, label: string, badge?: ReactNode) => (
    <div data-reveal className="flex items-center gap-3">
      <span className="grid size-[42px] place-items-center rounded-full bg-white/10 text-muted-foreground">{icon}</span>
      <div>
        <p className="flex items-center gap-2 text-base font-semibold">{value}{badge}</p>
        <p className="max-w-[20ch] text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )

  const hp = hover != null ? pts[hover] : null

  return (
    <div ref={root}>
      <div className="mb-5 flex flex-wrap items-center gap-x-10 gap-y-4">
        <h1 data-reveal className="min-w-32 text-[28px] font-medium leading-[1.04] tracking-tight">Access<br />Overview</h1>
        {stat(<ShieldCheck className="size-[18px]" />, <Count to={granted} />, 'Granted today',
          <span className="rounded-full bg-[#f0826f] px-2 py-0.5 text-[10px] font-semibold text-[#2b0d08]">{deniedRate}% denied</span>)}
        {stat(<Users className="size-[18px]" />, <Count to={users} />, 'Users on campus')}
        {stat(<Gauge className="size-[18px]" />, <Count to={grantRate} suffix="%" />, 'Grant rate, today')}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.75fr_1fr]">
        <div className="grid content-start gap-4">
          <section data-reveal className="solvik-card p-5" aria-label="Access flow">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Access flow</h2>
              <div className="flex items-center gap-2">
                <div className="flex rounded-full bg-black/30 p-[3px]" role="group" aria-label="Series">
                  {([['total', 'All'], ['entries', 'In'], ['exits', 'Out']] as const).map(([id, l]) => (
                    <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}
                      className={`min-h-8 rounded-full px-3.5 text-xs transition-colors ${mode === id ? 'bg-white/15 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{l}</button>
                  ))}
                </div>
                <button type="button" onClick={() => onNavigate('analytics')} aria-label="Open analytics"
                  className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-foreground">
                  <ArrowUpRight className="size-4" />
                </button>
              </div>
            </div>

            <p className="mb-0.5 mt-3.5 text-[34px] font-semibold tracking-tight">
              <Count to={total} from={Math.round(total * 0.88)} />{' '}
              <span className="text-[11px] font-normal tracking-normal text-muted-foreground">
                events today{peak ? ` · peak ${String(peak.hour).padStart(2, '0')}:00` : ''}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground"><span className="text-coral">●</span> Access events per hour</p>

            {data.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No access events yet today</p>
            ) : (
              <div className="relative mt-2">
                <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-pan-y" role="img"
                  aria-label={`Access events per hour today, ${total} in total`}
                  onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
                  <defs>
                    <linearGradient id="sv-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#ec7f72" stopOpacity=".38" />
                      <stop offset="1" stopColor="#ec7f72" stopOpacity="0" />
                    </linearGradient>
                    <filter id="sv-glow"><feGaussianBlur stdDeviation="4" /></filter>
                  </defs>
                  {[0, 0.5, 1].map(f => {
                    const y = BASE - f * (BASE - TOP)
                    return (
                      <g key={f}>
                        <line x1={X0} x2={W - 10} y1={y} y2={y} stroke="rgb(255 255 255 / 8%)" />
                        <text x="0" y={y + 3} fill="#8b9096" fontSize="10">{Math.round(yMax * f)}</text>
                      </g>
                    )
                  })}
                  <path data-fill d={`${line}L${pts[pts.length - 1][0]},${BASE}L${pts[0][0]},${BASE}Z`} fill="url(#sv-fill)" />
                  <path data-line d={line} pathLength={1} fill="none" stroke="#ec7f72" strokeWidth="5" opacity=".55" filter="url(#sv-glow)" />
                  <path data-line d={line} pathLength={1} fill="none" stroke="#f08a7a" strokeWidth="2.2" strokeLinecap="round" />
                  {data.map((d, i) => i % tickEvery === 0 && (
                    <text key={d.hour} x={pts[i][0]} y="252" textAnchor="middle" fill="#8b9096" fontSize="10">{String(d.hour).padStart(2, '0')}:00</text>
                  ))}
                  {hp && (
                    <g pointerEvents="none">
                      <line x1={hp[0]} x2={hp[0]} y1={TOP} y2={BASE} stroke="#f4f5f2" strokeOpacity=".5" strokeDasharray="3 5" />
                      <circle cx={hp[0]} cy={hp[1]} r="11" fill="#ec7f72" fillOpacity=".3" />
                      <circle cx={hp[0]} cy={hp[1]} r="5.5" fill="#f08a7a" />
                    </g>
                  )}
                </svg>
                {hp && hover != null && (
                  <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-2xl border border-white/10 bg-black/85 px-3.5 py-2.5 text-xs shadow-2xl backdrop-blur"
                    style={{ left: `${(hp[0] / W) * 100}%`, top: `${(hp[1] / H) * 100 - 3}%` }}>
                    <p className="text-muted-foreground">Today · {String(data[hover].hour).padStart(2, '0')}:00</p>
                    <p className="mt-0.5 text-base font-semibold">{data[hover].total} <span className="text-[11px] font-normal text-muted-foreground">events</span></p>
                    <p className="mt-0.5 flex gap-3"><span className="text-lime">↑ {data[hover].entries} in</span><span className="text-azure">↓ {data[hover].exits} out</span></p>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section data-reveal className="solvik-card p-5" style={{ background: 'rgb(120 140 40 / 38%)' }} aria-label="Gate uptime">
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">Gate uptime</h2>
                <button type="button" onClick={() => onNavigate('gates')} aria-label="Open gates" className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5"><MoreHorizontal className="size-4" /></button></div>
              <p className="mt-3.5 text-[28px] font-semibold"><Count to={uptime} suffix="%" /></p>
              <div className="my-3 h-2 overflow-hidden rounded-full bg-white/15"><i className="block h-full rounded-full bg-lime" style={{ width: `${uptime}%` }} /></div>
              <p className="text-[11px] text-[#d7dfb8]">{stats?.onlineGates ?? 0} of {stats?.totalGates ?? 0} gates online</p>
            </section>
            <section data-reveal className="solvik-card p-5" aria-label="User mix">
              <div className="flex items-center justify-between"><h2 className="text-sm font-medium">User mix</h2>
                <button type="button" onClick={() => onNavigate('users')} aria-label="Open users" className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5"><ArrowUpRight className="size-4" /></button></div>
              <p className="mt-3.5 text-[28px] font-semibold"><Count to={users} /></p>
              <div className="my-3 flex h-2 overflow-hidden rounded-full bg-white/15" role="img" aria-label="Users by type">
                {MIX.map(m => <i key={m.key} className="block h-full" style={{ width: users ? `${((stats?.usersByType[m.key] || 0) / users) * 100}%` : 0, background: m.color }} />)}
              </div>
              <ul className="grid grid-cols-2 gap-x-3 text-[11px] text-muted-foreground">
                {MIX.map(m => <li key={m.key} className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: m.color }} />{m.label}<b className="ml-auto font-medium text-foreground">{stats?.usersByType[m.key] || 0}</b></li>)}
              </ul>
            </section>
          </div>
        </div>

        <section data-reveal className="solvik-card p-5" aria-label="Busiest gates">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Busiest gates</h2>
            <div className="flex items-center gap-2"><span className="text-[11px] text-muted-foreground">by access logs</span>
              <button type="button" onClick={() => onNavigate('gates')} aria-label="Open gates" className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:text-foreground"><ArrowUpRight className="size-4" /></button></div>
          </div>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            {topGates.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No gates yet</p>}
            {topGates.map(g => (
              <article key={g.id} className="flex min-h-48 flex-col justify-between rounded-[22px] border border-white/10 bg-white/[0.09] p-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className={`font-semibold ${STATUS[g.status]}`}>{g.status}</span><DoorOpen className="size-4" aria-hidden="true" />
                  </div>
                  <h3 className="mt-1.5 text-[15px] font-medium leading-tight">{g.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{g.location}</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">{(g._count?.accessLogs ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">access logs</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

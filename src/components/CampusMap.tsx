'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DoorOpen, X } from 'lucide-react'

interface Gate {
    id: string
    name: string
    location: string
    gateType: string
    status: string
    _count?: { accessLogs: number }
}

interface CampusMapProps {
    gates: Gate[]
}

// Gate positions on the campus map (x%, y%)
const gatePositions: Record<string, { x: number; y: number }> = {
    MAIN: { x: 50, y: 8 },
    SECONDARY: { x: 88, y: 40 },
    LIBRARY: { x: 30, y: 45 },
    LABORATORY: { x: 65, y: 60 },
    PARKING: { x: 15, y: 80 },
    EMERGENCY: { x: 85, y: 85 },
}

const statusColors: Record<string, string> = {
    ONLINE: '#22c55e',
    OFFLINE: '#ef4444',
    MAINTENANCE: '#eab308',
    LOCKED: '#6b7280',
}

export function CampusMap({ gates }: CampusMapProps) {
    const [selected, setSelected] = useState<Gate | null>(null)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DoorOpen className="w-5 h-5" />
                    Campus Map
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                    {/* Campus background */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(135deg, #1a2332 0%, #1e3a4c 30%, #1a3328 60%, #1a2332 100%)',
                        }}
                    >
                        {/* Grid lines */}
                        <svg className="absolute inset-0 w-full h-full opacity-10">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <line key={`h${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="white" strokeWidth="0.5" />
                            ))}
                            {Array.from({ length: 20 }).map((_, i) => (
                                <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="white" strokeWidth="0.5" />
                            ))}
                        </svg>

                        {/* Campus buildings (simple rectangles) */}
                        <div className="absolute rounded-lg border border-white/20" style={{ left: '20%', top: '25%', width: '25%', height: '30%', background: 'rgba(255,255,255,0.05)' }}>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white/40 font-medium whitespace-nowrap">Main Building</span>
                        </div>
                        <div className="absolute rounded-lg border border-white/20" style={{ left: '55%', top: '35%', width: '20%', height: '25%', background: 'rgba(255,255,255,0.05)' }}>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white/40 font-medium whitespace-nowrap">Science Block</span>
                        </div>
                        <div className="absolute rounded-lg border border-white/20" style={{ left: '22%', top: '62%', width: '18%', height: '20%', background: 'rgba(255,255,255,0.05)' }}>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white/40 font-medium whitespace-nowrap">Library</span>
                        </div>
                        <div className="absolute rounded-lg border border-white/20" style={{ left: '55%', top: '70%', width: '15%', height: '15%', background: 'rgba(255,255,255,0.05)' }}>
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white/40 font-medium whitespace-nowrap">Parking</span>
                        </div>

                        {/* Roads */}
                        <div className="absolute bg-white/10 rounded" style={{ left: '48%', top: '0', width: '4%', height: '100%' }} />
                        <div className="absolute bg-white/10 rounded" style={{ left: '0', top: '55%', width: '100%', height: '3%' }} />

                        {/* Gate markers */}
                        {gates.map((gate) => {
                            const pos = gatePositions[gate.gateType] || { x: 50, y: 50 }
                            const color = statusColors[gate.status] || '#6b7280'

                            return (
                                <button
                                    key={gate.id}
                                    onClick={() => setSelected(selected?.id === gate.id ? null : gate)}
                                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                >
                                    {/* Pulse ring */}
                                    {gate.status === 'ONLINE' && (
                                        <span
                                            className="absolute inset-0 rounded-full animate-ping opacity-40"
                                            style={{ background: color, width: '24px', height: '24px' }}
                                        />
                                    )}
                                    {/* Dot */}
                                    <span
                                        className="relative block w-6 h-6 rounded-full border-2 border-white/60 shadow-lg transition-transform group-hover:scale-125"
                                        style={{ background: color, boxShadow: `0 0 12px ${color}80` }}
                                    />
                                    {/* Label */}
                                    <span className="absolute left-1/2 -translate-x-1/2 top-8 text-[10px] text-white/80 font-medium whitespace-nowrap bg-black/40 px-2 py-0.5 rounded">
                                        {gate.name}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Gate detail popup */}
                    {selected && (
                        <div
                            className="absolute z-20 bg-white dark:bg-slate-800 rounded-xl shadow-xl border p-4 w-56"
                            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm">{selected.name}</h4>
                                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Location</span>
                                    <span>{selected.location}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Type</span>
                                    <span>{selected.gateType}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Status</span>
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0"
                                        style={{ color: statusColors[selected.status], borderColor: statusColors[selected.status] }}
                                    >
                                        {selected.status}
                                    </Badge>
                                </div>
                                {selected._count && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Total Scans</span>
                                        <span>{selected._count.accessLogs}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 flex gap-3">
                        {Object.entries(statusColors).map(([status, color]) => (
                            <div key={status} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                                <span className="text-[10px] text-white/70">{status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

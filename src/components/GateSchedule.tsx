'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Lock, Unlock } from 'lucide-react'

interface Gate {
    id: string
    name: string
    location: string
    gateType: string
    status: string
}

interface Schedule {
    gateId: string
    gateName: string
    lockTime: string
    unlockTime: string
    daysActive: string[]
    enabled: boolean
}

interface GateScheduleProps {
    gates: Gate[]
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function GateSchedule({ gates }: GateScheduleProps) {
    const [schedules, setSchedules] = useState<Schedule[]>(() =>
        gates.map(g => ({
            gateId: g.id,
            gateName: g.name,
            lockTime: g.gateType === 'LABORATORY' ? '21:00' : g.gateType === 'LIBRARY' ? '22:00' : '23:00',
            unlockTime: g.gateType === 'LABORATORY' ? '07:00' : g.gateType === 'LIBRARY' ? '06:00' : '06:00',
            daysActive: [...DAYS],
            enabled: g.gateType !== 'MAIN',
        }))
    )

    const toggleDay = (gateId: string, day: string) => {
        setSchedules(prev =>
            prev.map(s =>
                s.gateId === gateId
                    ? { ...s, daysActive: s.daysActive.includes(day) ? s.daysActive.filter(d => d !== day) : [...s.daysActive, day] }
                    : s
            )
        )
    }

    const toggleEnabled = (gateId: string) => {
        setSchedules(prev =>
            prev.map(s => (s.gateId === gateId ? { ...s, enabled: !s.enabled } : s))
        )
    }

    const updateTime = (gateId: string, field: 'lockTime' | 'unlockTime', value: string) => {
        setSchedules(prev =>
            prev.map(s => (s.gateId === gateId ? { ...s, [field]: value } : s))
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Gate Scheduling
                </CardTitle>
                <CardDescription>Auto-lock/unlock gates based on time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {schedules.map(schedule => (
                    <div
                        key={schedule.gateId}
                        className={`p-4 rounded-xl border transition-all ${schedule.enabled
                                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{schedule.gateName}</span>
                                <Badge variant="outline" className="text-xs">
                                    {schedule.enabled ? 'Active' : 'Disabled'}
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEnabled(schedule.gateId)}
                                className={schedule.enabled ? 'text-green-600' : 'text-slate-400'}
                            >
                                {schedule.enabled ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </Button>
                        </div>

                        {schedule.enabled && (
                            <>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-3 h-3 text-red-500" />
                                        <label className="text-xs text-slate-500">Lock</label>
                                        <input
                                            type="time"
                                            value={schedule.lockTime}
                                            onChange={e => updateTime(schedule.gateId, 'lockTime', e.target.value)}
                                            className="text-xs px-2 py-1 rounded-md border bg-transparent dark:border-slate-700"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Unlock className="w-3 h-3 text-green-500" />
                                        <label className="text-xs text-slate-500">Unlock</label>
                                        <input
                                            type="time"
                                            value={schedule.unlockTime}
                                            onChange={e => updateTime(schedule.gateId, 'unlockTime', e.target.value)}
                                            className="text-xs px-2 py-1 rounded-md border bg-transparent dark:border-slate-700"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    {DAYS.map(day => (
                                        <button
                                            key={day}
                                            onClick={() => toggleDay(schedule.gateId, day)}
                                            className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors ${schedule.daysActive.includes(day)
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

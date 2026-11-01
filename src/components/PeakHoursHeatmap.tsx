'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

interface PeakHoursHeatmapProps {
    data: number[][] // 7 days × 24 hours
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = Array.from({ length: 24 }, (_, i) => {
    if (i === 0) return '12a'
    if (i < 12) return `${i}a`
    if (i === 12) return '12p'
    return `${i - 12}p`
})

function getHeatColor(value: number, max: number): string {
    if (max === 0) return 'rgba(16, 185, 129, 0.05)'
    const intensity = value / max
    if (intensity > 0.8) return 'rgba(239, 68, 68, 0.8)'
    if (intensity > 0.6) return 'rgba(249, 115, 22, 0.7)'
    if (intensity > 0.4) return 'rgba(234, 179, 8, 0.6)'
    if (intensity > 0.2) return 'rgba(16, 185, 129, 0.4)'
    if (intensity > 0.05) return 'rgba(16, 185, 129, 0.15)'
    return 'rgba(16, 185, 129, 0.05)'
}

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
    const max = Math.max(...data.flat(), 1)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Peak Hours Heatmap
                </CardTitle>
                <CardDescription>Busiest access times per day of the week</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                        {/* Hours header */}
                        <div className="flex items-center gap-0.5 mb-1 pl-10">
                            {HOURS.map((h, i) => (
                                <div key={i} className="flex-1 text-center text-[9px] text-slate-400">
                                    {i % 3 === 0 ? h : ''}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        {DAYS.map((day, dayIdx) => (
                            <div key={day} className="flex items-center gap-0.5 mb-0.5">
                                <span className="text-[11px] text-slate-500 w-10 text-right pr-2 font-medium">{day}</span>
                                {(data[dayIdx] || Array(24).fill(0)).map((val, hourIdx) => (
                                    <div
                                        key={hourIdx}
                                        className="flex-1 rounded-sm transition-colors cursor-default group relative"
                                        style={{
                                            background: getHeatColor(val, max),
                                            height: '22px',
                                        }}
                                        title={`${day} ${HOURS[hourIdx]}: ${val} accesses`}
                                    >
                                        {/* Hover tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                            <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                                {val} accesses
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Legend */}
                        <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-slate-400">
                            <span>Less</span>
                            <div className="flex gap-0.5">
                                {[0.05, 0.2, 0.4, 0.6, 0.8].map((intensity, i) => (
                                    <div
                                        key={i}
                                        className="w-4 h-3.5 rounded-sm"
                                        style={{ background: getHeatColor(intensity * max, max) }}
                                    />
                                ))}
                            </div>
                            <span>More</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

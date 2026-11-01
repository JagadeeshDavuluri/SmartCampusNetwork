'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Users } from 'lucide-react'

interface Zone {
    name: string
    current: number
    capacity: number
    gateType: string
}

interface OccupancyTrackerProps {
    zones: Zone[]
}

export function OccupancyTracker({ zones }: OccupancyTrackerProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Live Occupancy
                </CardTitle>
                <CardDescription>Current occupancy per zone based on entry/exit data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {zones.map(zone => {
                    const percentage = Math.min(Math.round((zone.current / zone.capacity) * 100), 100)
                    const isHigh = percentage > 80
                    const isMedium = percentage > 50

                    return (
                        <div key={zone.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{zone.name}</span>
                                    {isHigh && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 font-medium">
                                            Near Capacity
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm">
                                    <span className={`font-semibold ${isHigh ? 'text-red-600' : isMedium ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {zone.current}
                                    </span>
                                    <span className="text-slate-400">/{zone.capacity}</span>
                                </span>
                            </div>
                            <div className="relative">
                                <Progress
                                    value={percentage}
                                    className={`h-2.5 ${isHigh ? '[&>div]:bg-red-500' : isMedium ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                                />
                            </div>
                        </div>
                    )
                })}

                {/* Summary */}
                <div className="pt-3 border-t flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Campus Occupancy</span>
                    <span className="font-semibold">
                        {zones.reduce((a, z) => a + z.current, 0)} people
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}

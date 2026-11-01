import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const now = new Date()

        // --- Weekly Trends (past 7 days) ---
        const weeklyTrends: { date: string; entries: number; exits: number; denied: number }[] = []
        for (let d = 6; d >= 0; d--) {
            const dayStart = new Date(now)
            dayStart.setDate(now.getDate() - d)
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setHours(23, 59, 59, 999)

            const entries = await db.accessLog.count({
                where: { timestamp: { gte: dayStart, lte: dayEnd }, accessType: 'ENTRY', result: 'GRANTED' },
            })
            const exits = await db.accessLog.count({
                where: { timestamp: { gte: dayStart, lte: dayEnd }, accessType: 'EXIT', result: 'GRANTED' },
            })
            const denied = await db.accessLog.count({
                where: { timestamp: { gte: dayStart, lte: dayEnd }, result: 'DENIED' },
            })

            weeklyTrends.push({
                date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                entries,
                exits,
                denied,
            })
        }

        // --- Anomalies ---
        interface AnomalyResult {
            id: string
            type: 'after_hours' | 'rapid_access' | 'repeated_denial'
            severity: 'LOW' | 'MEDIUM' | 'HIGH'
            description: string
            timestamp: string
            userName?: string
            gateName?: string
        }
        const anomalies: AnomalyResult[] = []

        // After-hours access (midnight to 5 AM)
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)
        const afterHoursLogs = await db.accessLog.findMany({
            where: {
                timestamp: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
                result: 'GRANTED',
            },
            include: { user: true, gate: true },
            orderBy: { timestamp: 'desc' },
            take: 100,
        })

        for (const log of afterHoursLogs) {
            const hour = new Date(log.timestamp).getHours()
            if (hour >= 0 && hour < 5) {
                anomalies.push({
                    id: `ah-${log.id}`,
                    type: 'after_hours',
                    severity: hour < 3 ? 'HIGH' : 'MEDIUM',
                    description: `Access granted at ${new Date(log.timestamp).toLocaleTimeString()}`,
                    timestamp: log.timestamp.toISOString(),
                    userName: log.user?.name,
                    gateName: log.gate.name,
                })
            }
        }

        // Repeated denials (3+ in recent logs)
        const deniedLogs = await db.accessLog.findMany({
            where: {
                result: 'DENIED',
                timestamp: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
            },
            include: { user: true, gate: true },
            orderBy: { timestamp: 'desc' },
        })

        const denialCounts: Record<string, { count: number; userName: string; gateName: string; timestamp: string }> = {}
        for (const log of deniedLogs) {
            const key = log.userId || log.gateId
            if (!denialCounts[key]) {
                denialCounts[key] = { count: 0, userName: log.user?.name || 'Unknown', gateName: log.gate.name, timestamp: log.timestamp.toISOString() }
            }
            denialCounts[key].count++
        }

        for (const [key, data] of Object.entries(denialCounts)) {
            if (data.count >= 3) {
                anomalies.push({
                    id: `rd-${key}`,
                    type: 'repeated_denial',
                    severity: data.count >= 5 ? 'HIGH' : 'MEDIUM',
                    description: `${data.count} denied attempts in the last 24 hours`,
                    timestamp: data.timestamp,
                    userName: data.userName,
                    gateName: data.gateName,
                })
            }
        }

        // --- Occupancy per zone ---
        const gates = await db.gate.findMany()
        const zones = await Promise.all(
            gates.map(async (gate) => {
                const entryCount = await db.accessLog.count({
                    where: { gateId: gate.id, accessType: 'ENTRY', result: 'GRANTED', timestamp: { gte: todayStart } },
                })
                const exitCount = await db.accessLog.count({
                    where: { gateId: gate.id, accessType: 'EXIT', result: 'GRANTED', timestamp: { gte: todayStart } },
                })
                const capacityMap: Record<string, number> = {
                    MAIN: 500, SECONDARY: 300, LIBRARY: 150, LABORATORY: 80, PARKING: 200, EMERGENCY: 100,
                }
                return {
                    name: gate.name,
                    gateType: gate.gateType,
                    current: Math.max(entryCount - exitCount, 0),
                    capacity: capacityMap[gate.gateType] || 100,
                }
            })
        )

        // --- Peak Hours Heatmap (7 days × 24 hours) ---
        const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
        const weekLogs = await db.accessLog.findMany({
            where: { timestamp: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            select: { timestamp: true },
        })

        for (const log of weekLogs) {
            const date = new Date(log.timestamp)
            const dayOfWeek = (date.getDay() + 6) % 7 // Monday=0
            const hour = date.getHours()
            heatmap[dayOfWeek][hour]++
        }

        return NextResponse.json({
            weeklyTrends,
            anomalies: anomalies.slice(0, 20),
            zones,
            heatmap,
        })
    } catch (error) {
        console.error('Analytics error:', error)
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
}

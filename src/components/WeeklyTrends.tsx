'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface WeeklyTrendsProps {
    data: { date: string; entries: number; exits: number; denied: number }[]
}

export function WeeklyTrends({ data }: WeeklyTrendsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Weekly Access Trends
                </CardTitle>
                <CardDescription>Entries, exits, and denied attempts over the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="gradEntries" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradExits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradDenied" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '12px',
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="entries" stroke="#10b981" fill="url(#gradEntries)" strokeWidth={2} name="Entries" />
                        <Area type="monotone" dataKey="exits" stroke="#6366f1" fill="url(#gradExits)" strokeWidth={2} name="Exits" />
                        <Area type="monotone" dataKey="denied" stroke="#ef4444" fill="url(#gradDenied)" strokeWidth={2} name="Denied" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

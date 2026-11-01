'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, CreditCard, ShieldAlert } from 'lucide-react'

interface Anomaly {
    id: string
    type: 'after_hours' | 'rapid_access' | 'repeated_denial'
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    description: string
    timestamp: string
    userName?: string
    gateName?: string
}

interface AnomalyDetectorProps {
    anomalies: Anomaly[]
}

const typeIcons: Record<string, typeof AlertTriangle> = {
    after_hours: Clock,
    rapid_access: CreditCard,
    repeated_denial: ShieldAlert,
}

const typeLabels: Record<string, string> = {
    after_hours: 'After Hours',
    rapid_access: 'Rapid Access',
    repeated_denial: 'Repeated Denial',
}

const severityColors: Record<string, string> = {
    LOW: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    HIGH: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export function AnomalyDetector({ anomalies }: AnomalyDetectorProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Anomaly Detection
                    {anomalies.length > 0 && (
                        <Badge className="bg-red-500 text-white text-xs ml-2">{anomalies.length}</Badge>
                    )}
                </CardTitle>
                <CardDescription>Flagged unusual access patterns</CardDescription>
            </CardHeader>
            <CardContent>
                {anomalies.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No anomalies detected</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {anomalies.map(anomaly => {
                            const Icon = typeIcons[anomaly.type] || AlertTriangle
                            return (
                                <div key={anomaly.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${anomaly.severity === 'HIGH' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                                            anomaly.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                        }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Badge variant="outline" className={`text-[10px] ${severityColors[anomaly.severity]}`}>
                                                {anomaly.severity}
                                            </Badge>
                                            <Badge variant="outline" className="text-[10px]">
                                                {typeLabels[anomaly.type]}
                                            </Badge>
                                        </div>
                                        <p className="text-sm">{anomaly.description}</p>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                            {anomaly.userName && <span>User: {anomaly.userName}</span>}
                                            {anomaly.gateName && <span>• Gate: {anomaly.gateName}</span>}
                                            <span>• {new Date(anomaly.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { QrCode, UserPlus, CheckCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface VisitorPassProps {
    className?: string
}

interface Pass {
    id: string
    name: string
    purpose: string
    host: string
    qrData: string
    createdAt: Date
    validUntil: Date
}

export function VisitorPass({ className = '' }: VisitorPassProps) {
    const [passes, setPasses] = useState<Pass[]>([])
    const [form, setForm] = useState({
        name: '',
        purpose: 'meeting',
        host: '',
        duration: '4',
    })

    const generateQrSvg = (data: string, size: number = 160) => {
        // Simple QR-like pattern based on data hash
        const hash = data.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
        const grid = 21
        const cellSize = size / (grid + 2)
        const cells: { x: number; y: number }[] = []

        // Generate pattern from hash
        for (let r = 0; r < grid; r++) {
            for (let c = 0; c < grid; c++) {
                const seed = (hash * (r * grid + c + 1)) & 0xFFFF
                // Finder patterns (corners)
                const isFinderTL = r < 7 && c < 7
                const isFinderTR = r < 7 && c >= grid - 7
                const isFinderBL = r >= grid - 7 && c < 7
                const isFinder = isFinderTL || isFinderTR || isFinderBL

                if (isFinder) {
                    const lr = r % 7
                    const lc = c % 7
                    if (lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)) {
                        cells.push({ x: c + 1, y: r + 1 })
                    }
                } else if (seed % 3 !== 0) {
                    cells.push({ x: c + 1, y: r + 1 })
                }
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="white" rx="8"/>
      ${cells.map(({ x, y }) => `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" rx="0.5"/>`).join('')}
    </svg>`
    }

    const handleCreate = () => {
        if (!form.name || !form.host) {
            toast.error('Name and host faculty are required')
            return
        }

        const id = `VIS-${Date.now().toString(36).toUpperCase()}`
        const validUntil = new Date(Date.now() + parseInt(form.duration) * 60 * 60 * 1000)
        const qrData = `CAMPUS:${id}:${form.name}:${validUntil.toISOString()}`

        const pass: Pass = {
            id,
            name: form.name,
            purpose: form.purpose,
            host: form.host,
            qrData,
            createdAt: new Date(),
            validUntil,
        }

        setPasses(prev => [pass, ...prev])
        setForm({ name: '', purpose: 'meeting', host: '', duration: '4' })
        toast.success(`Visitor pass ${id} created for ${form.name}`)
    }

    const copyPassId = (id: string) => {
        navigator.clipboard.writeText(id)
        toast.success('Pass ID copied')
    }

    const qrSvgs = useMemo(() => {
        const map: Record<string, string> = {}
        passes.forEach(p => {
            map[p.id] = generateQrSvg(p.qrData)
        })
        return map
    }, [passes])

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Visitor Pre-Registration
                </CardTitle>
                <CardDescription>Register visitors and generate access passes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Visitor Name</Label>
                        <Input
                            placeholder="John Doe"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Host Faculty</Label>
                        <Input
                            placeholder="Dr. Smith"
                            value={form.host}
                            onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Purpose</Label>
                        <Select value={form.purpose} onValueChange={v => setForm(f => ({ ...f, purpose: v }))}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="delivery">Delivery</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-xs">Valid Duration</Label>
                        <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Hour</SelectItem>
                                <SelectItem value="2">2 Hours</SelectItem>
                                <SelectItem value="4">4 Hours</SelectItem>
                                <SelectItem value="8">Full Day</SelectItem>
                                <SelectItem value="24">24 Hours</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleCreate} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <UserPlus className="w-4 h-4 mr-2" /> Generate Pass
                </Button>

                {/* Passes list */}
                {passes.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Passes</h4>
                        {passes.slice(0, 5).map(pass => (
                            <div key={pass.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                                {/* QR Code */}
                                <div
                                    className="w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden"
                                    dangerouslySetInnerHTML={{ __html: qrSvgs[pass.id] || '' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">{pass.name}</span>
                                        <Badge variant="outline" className="text-[10px]">{pass.purpose}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500">Host: {pass.host}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="text-[10px] bg-emerald-500 text-white">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            {pass.id}
                                        </Badge>
                                        <button onClick={() => copyPassId(pass.id)} className="text-slate-400 hover:text-slate-600">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Valid until {pass.validUntil.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

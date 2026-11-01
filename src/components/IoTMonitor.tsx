'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Cpu, Wifi, WifiOff, Thermometer, Droplets, Wind,
    Zap, RefreshCw, Power, RotateCcw, Signal, AlertTriangle,
    CheckCircle, Clock, MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import { AnimatedCounter } from '@/components/AnimatedCounter'

// ─── Types ────────────────────────────────────────────────────────────────────
type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'MAINTENANCE'
type DeviceType = 'SENSOR' | 'CONTROLLER' | 'CAMERA' | 'READER' | 'GATEWAY'

interface IoTDevice {
    id: string
    name: string
    type: DeviceType
    location: string
    status: DeviceStatus
    signal: number        // 0-100
    lastPing: string      // ISO string
    ip: string
    firmware: string
    sensors: {
        temperature: number   // °C
        humidity: number      // %
        co2: number           // ppm
        power: number         // W
    }
}

// ─── Simulated seed data ──────────────────────────────────────────────────────
const SEED_DEVICES: Omit<IoTDevice, 'sensors' | 'lastPing' | 'signal'>[] = [
    { id: 'd1', name: 'Main Gate Controller', type: 'CONTROLLER', location: 'Main Entrance', status: 'ONLINE', ip: '192.168.1.10', firmware: 'v2.4.1' },
    { id: 'd2', name: 'Library Env Sensor', type: 'SENSOR', location: 'Library Block', status: 'ONLINE', ip: '192.168.1.11', firmware: 'v1.9.3' },
    { id: 'd3', name: 'Lab RFID Reader', type: 'READER', location: 'CS Lab A', status: 'WARNING', ip: '192.168.1.12', firmware: 'v3.0.0' },
    { id: 'd4', name: 'Parking Camera Node', type: 'CAMERA', location: 'Parking Lot', status: 'ONLINE', ip: '192.168.1.13', firmware: 'v2.1.5' },
    { id: 'd5', name: 'IoT Gateway Hub', type: 'GATEWAY', location: 'Server Room', status: 'ONLINE', ip: '192.168.1.1', firmware: 'v4.2.0' },
    { id: 'd6', name: 'Canteen Sensor Node', type: 'SENSOR', location: 'Canteen', status: 'OFFLINE', ip: '192.168.1.14', firmware: 'v1.8.0' },
    { id: 'd7', name: 'Admin Block Reader', type: 'READER', location: 'Admin Block', status: 'ONLINE', ip: '192.168.1.15', firmware: 'v3.0.0' },
    { id: 'd8', name: 'Gym Controller', type: 'CONTROLLER', location: 'Sports Complex', status: 'MAINTENANCE', ip: '192.168.1.16', firmware: 'v2.3.2' },
]

function randomBetween(min: number, max: number) {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

function generateDevice(seed: typeof SEED_DEVICES[number]): IoTDevice {
    const isOffline = seed.status === 'OFFLINE'
    return {
        ...seed,
        signal: isOffline ? 0 : randomBetween(45, 99),
        lastPing: isOffline
            ? new Date(Date.now() - randomBetween(300, 1800) * 1000).toISOString()
            : new Date(Date.now() - randomBetween(1, 30) * 1000).toISOString(),
        sensors: {
            temperature: isOffline ? 0 : randomBetween(18, 38),
            humidity: isOffline ? 0 : randomBetween(30, 80),
            co2: isOffline ? 0 : randomBetween(400, 1200),
            power: isOffline ? 0 : randomBetween(5, 120),
        },
    }
}

function generateDevices(): IoTDevice[] {
    return SEED_DEVICES.map(generateDevice)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DEVICE_TYPE_ICON: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
    SENSOR: Thermometer,
    CONTROLLER: Cpu,
    CAMERA: Signal,
    READER: CheckCircle,
    GATEWAY: Wifi,
}

function statusColor(status: DeviceStatus) {
    switch (status) {
        case 'ONLINE': return 'bg-green-500/10 text-green-600 border-green-500/20'
        case 'OFFLINE': return 'bg-red-500/10 text-red-600 border-red-500/20'
        case 'WARNING': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
        case 'MAINTENANCE': return 'bg-slate-500/10 text-slate-600 border-slate-500/20'
    }
}

function signalColor(signal: number) {
    if (signal >= 70) return 'text-green-500'
    if (signal >= 40) return 'text-yellow-500'
    return 'text-red-500'
}

function relativeTime(isoString: string) {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
}

// ─── Component ────────────────────────────────────────────────────────────────
export function IoTMonitor() {
    const [devices, setDevices] = useState<IoTDevice[]>(generateDevices)
    const [selectedId, setSelectedId] = useState<string | null>('d1')
    const [refreshing, setRefreshing] = useState(false)

    const refresh = useCallback((silent = false) => {
        if (!silent) setRefreshing(true)
        setDevices(generateDevices())
        if (!silent) {
            setTimeout(() => setRefreshing(false), 600)
        }
    }, [])

    // auto-refresh every 10 s
    useEffect(() => {
        const id = setInterval(() => refresh(true), 10_000)
        return () => clearInterval(id)
    }, [refresh])

    const online = devices.filter(d => d.status === 'ONLINE').length
    const offline = devices.filter(d => d.status === 'OFFLINE').length
    const warnings = devices.filter(d => d.status === 'WARNING' || d.status === 'MAINTENANCE').length
    const selected = devices.find(d => d.id === selectedId) ?? null

    const handleRestart = (device: IoTDevice) => {
        toast.success(`Restart command sent to "${device.name}"`)
    }

    const handleToggle = (device: IoTDevice) => {
        setDevices(prev => prev.map(d =>
            d.id === device.id
                ? { ...d, status: d.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' }
                : d
        ))
        toast.info(`"${device.name}" toggled ${device.status === 'ONLINE' ? 'OFF' : 'ON'}`)
    }

    return (
        <div className="space-y-6">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Cpu className="w-7 h-7 text-cyan-500" />
                        IoT Device Connectivity
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Real-time monitoring &amp; remote management</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refresh(false)}
                    disabled={refreshing}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-cyan-100 text-sm">Total Devices</p>
                            <p className="text-3xl font-bold"><AnimatedCounter value={devices.length} /></p>
                        </div>
                        <Cpu className="w-10 h-10 text-cyan-200" />
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Online</p>
                            <p className="text-3xl font-bold"><AnimatedCounter value={online} /></p>
                        </div>
                        <Wifi className="w-10 h-10 text-green-200" />
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm">Offline</p>
                            <p className="text-3xl font-bold"><AnimatedCounter value={offline} /></p>
                        </div>
                        <WifiOff className="w-10 h-10 text-red-200" />
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-sm">Warnings</p>
                            <p className="text-3xl font-bold"><AnimatedCounter value={warnings} /></p>
                        </div>
                        <AlertTriangle className="w-10 h-10 text-yellow-200" />
                    </CardContent>
                </Card>
            </div>

            {/* Main grid: device list + detail panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Device list */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Signal className="w-4 h-4 text-cyan-500" />
                            Connected Devices
                        </CardTitle>
                        <CardDescription>Click a device to inspect</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[420px]">
                            <div className="p-3 space-y-2">
                                {devices.map(device => {
                                    const TypeIcon = DEVICE_TYPE_ICON[device.type]
                                    const isSelected = device.id === selectedId
                                    return (
                                        <button
                                            key={device.id}
                                            onClick={() => setSelectedId(device.id)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected
                                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                                                    : 'border-transparent bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${device.status === 'ONLINE'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                                        : device.status === 'WARNING'
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                                                            : device.status === 'MAINTENANCE'
                                                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-500'
                                                    }`}>
                                                    <TypeIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{device.name}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="w-3 h-3" />
                                                        {device.location}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge variant="outline" className={`text-xs ${statusColor(device.status)}`}>
                                                        {device.status}
                                                    </Badge>
                                                    <span className={`text-xs font-medium ${signalColor(device.signal)}`}>
                                                        {device.signal}%
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Detail panel */}
                <div className="lg:col-span-2 space-y-4">
                    {selected ? (
                        <>
                            {/* Device info */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between flex-wrap gap-2">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                {(() => { const I = DEVICE_TYPE_ICON[selected.type]; return <I className="w-5 h-5 text-cyan-500" /> })()}
                                                {selected.name}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" /> {selected.location} &nbsp;•&nbsp; {selected.type}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className={`${statusColor(selected.status)} text-sm`}>
                                            {selected.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                                        <div>
                                            <p className="text-slate-500">IP Address</p>
                                            <p className="font-mono font-medium">{selected.ip}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Firmware</p>
                                            <p className="font-medium">{selected.firmware}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Signal</p>
                                            <p className={`font-bold ${signalColor(selected.signal)}`}>{selected.signal}%</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Last Ping</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {relativeTime(selected.lastPing)}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Signal bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>Signal Strength</span>
                                            <span>{selected.signal}%</span>
                                        </div>
                                        <Progress
                                            value={selected.signal}
                                            className="h-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sensor readings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Thermometer className="w-4 h-4 text-orange-500" />
                                        Live Sensor Readings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* Temperature */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Thermometer className="w-4 h-4 text-orange-500" />
                                                    Temperature
                                                </div>
                                                <span className="font-bold text-orange-600">{selected.sensors.temperature}°C</span>
                                            </div>
                                            <Progress value={(selected.sensors.temperature / 50) * 100} className="h-2" />
                                            <p className="text-xs text-slate-400">Normal range: 18 – 28 °C</p>
                                        </div>
                                        {/* Humidity */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Droplets className="w-4 h-4 text-blue-500" />
                                                    Humidity
                                                </div>
                                                <span className="font-bold text-blue-600">{selected.sensors.humidity}%</span>
                                            </div>
                                            <Progress value={selected.sensors.humidity} className="h-2" />
                                            <p className="text-xs text-slate-400">Normal range: 40 – 60 %</p>
                                        </div>
                                        {/* CO₂ */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Wind className="w-4 h-4 text-green-500" />
                                                    CO₂ Level
                                                </div>
                                                <span className="font-bold text-green-700">{selected.sensors.co2} ppm</span>
                                            </div>
                                            <Progress value={(selected.sensors.co2 / 1500) * 100} className="h-2" />
                                            <p className="text-xs text-slate-400">Safe limit: &lt; 1000 ppm</p>
                                        </div>
                                        {/* Power */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <Zap className="w-4 h-4 text-yellow-500" />
                                                    Power Usage
                                                </div>
                                                <span className="font-bold text-yellow-600">{selected.sensors.power} W</span>
                                            </div>
                                            <Progress value={(selected.sensors.power / 150) * 100} className="h-2" />
                                            <p className="text-xs text-slate-400">Max rated: 150 W</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Remote actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Power className="w-4 h-4 text-purple-500" />
                                        Remote Actions
                                    </CardTitle>
                                    <CardDescription>Send commands to this device</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRestart(selected)}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2 text-cyan-500" />
                                            Restart Device
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggle(selected)}
                                            className={selected.status === 'ONLINE' ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950'}
                                        >
                                            <Power className="w-4 h-4 mr-2" />
                                            {selected.status === 'ONLINE' ? 'Power Off' : 'Power On'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { refresh(false); toast.info(`Diagnostics run for "${selected.name}"`) }}
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2 text-purple-500" />
                                            Run Diagnostics
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card>
                            <CardContent className="py-20 flex flex-col items-center gap-3 text-slate-400">
                                <Cpu className="w-12 h-12" />
                                <p className="text-sm">Select a device to view details</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

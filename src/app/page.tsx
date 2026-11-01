'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Shield, Users, DoorOpen, Activity, AlertTriangle, Settings,
  UserPlus, Scan, CheckCircle, XCircle, Clock, MapPin,
  TrendingUp, TrendingDown, Wifi, WifiOff, Bell,
  Fingerprint, CreditCard, RefreshCw, Plus, Trash2, Edit,
  BarChart3, PieChart, Sun, Moon, LogOut, Download, Printer,
  Map, ChevronLeft, ChevronRight, FileText, Cpu
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts'
import Chatbot from '@/components/Chatbot'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { exportToCSV, printReport } from '@/lib/export'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { EmptyState } from '@/components/EmptyState'
import { SkeletonDashboard } from '@/components/SkeletonDashboard'
import { CampusMap } from '@/components/CampusMap'
import { MobileNav } from '@/components/MobileNav'
import { GateSchedule } from '@/components/GateSchedule'
import { VisitorPass } from '@/components/VisitorPass'
import { WeeklyTrends } from '@/components/WeeklyTrends'
import { AnomalyDetector } from '@/components/AnomalyDetector'
import { OccupancyTracker } from '@/components/OccupancyTracker'
import { PeakHoursHeatmap } from '@/components/PeakHoursHeatmap'
import { IoTMonitor } from '@/components/IoTMonitor'
import { SolvikShell } from '@/components/solvik/SolvikShell'
import { SolvikOverview } from '@/components/solvik/SolvikOverview'

// Types
interface CampusUser {
  id: string
  name: string
  email: string
  phone?: string
  userType: 'STUDENT' | 'STAFF' | 'FACULTY' | 'VISITOR' | 'ADMIN' | 'SECURITY'
  department?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  rfidCardId?: string
  biometricId?: string
  createdAt: string
  _count?: { accessLogs: number }
}

interface Gate {
  id: string
  name: string
  location: string
  gateType: 'MAIN' | 'SECONDARY' | 'EMERGENCY' | 'PARKING' | 'LABORATORY' | 'LIBRARY'
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'LOCKED'
  lastOnline?: string
  _count?: { accessLogs: number }
}

interface AccessLog {
  id: string
  userId?: string
  user?: CampusUser
  gateId: string
  gate: Gate
  accessType: 'ENTRY' | 'EXIT'
  authMethod: 'RFID' | 'BIOMETRIC' | 'BOTH' | 'MANUAL' | 'MOBILE'
  result: 'GRANTED' | 'DENIED' | 'PENDING' | 'FAILED'
  reason?: string
  timestamp: string
}

interface SecurityAlert {
  id: string
  alertType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description?: string
  gateId?: string
  userId?: string
  resolved: boolean
  resolvedAt?: string
  timestamp: string
}

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalGates: number
  onlineGates: number
  todayAccessLogs: number
  grantedToday: number
  deniedToday: number
  activeAlerts: number
  usersByType: {
    students: number
    staff: number
    faculty: number
    visitors: number
  }
}

interface HourlyData {
  hour: number
  entries: number
  exits: number
}

interface ScanResult {
  success: boolean
  result: 'GRANTED' | 'DENIED'
  reason?: string
  user?: {
    id: string
    name: string
    email: string
    userType: string
    department?: string
  }
  gate?: {
    id: string
    name: string
    location: string
  }
  logId?: string
  log?: Record<string, unknown>
}

export default function SmartCampusDashboard() {
  // Auth state
  const [adminUser, setAdminUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // Theme
  const { theme, setTheme } = useTheme()

  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([])
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [users, setUsers] = useState<CampusUser[]>([])
  const [gates, setGates] = useState<Gate[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [allAlerts, setAllAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    userType: 'STUDENT',
    department: '',
    rfidCardId: '',
    biometricId: ''
  })
  const [newGate, setNewGate] = useState({
    name: '',
    location: '',
    gateType: 'MAIN'
  })
  const [scanForm, setScanForm] = useState({
    gateId: '',
    scanType: 'RFID',
    scanData: ''
  })

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    weeklyTrends: { date: string; entries: number; exits: number; denied: number }[]
    anomalies: { id: string; type: 'after_hours' | 'rapid_access' | 'repeated_denial'; severity: 'LOW' | 'MEDIUM' | 'HIGH'; description: string; timestamp: string; userName?: string; gateName?: string }[]
    zones: { name: string; gateType: string; current: number; capacity: number }[]
    heatmap: number[][]
  } | null>(null)

  // Pagination state
  const [logPage, setLogPage] = useState(1)
  const LOGS_PER_PAGE = 10

  // Filters
  const [userFilter, setUserFilter] = useState({ type: 'all', status: 'all', search: '' })

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/access-control/dashboard/stats')
      const data = await response.json()
      setStats(data.stats)
      setRecentLogs(data.recentLogs)
      setAlerts(data.alerts)
      setHourlyData(data.hourlyData)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }, [])

  // Fetch users - accepts optional filter params for immediate use
  const fetchUsers = useCallback(async (filterOverride?: Partial<typeof userFilter>) => {
    try {
      const filter = filterOverride ? { ...userFilter, ...filterOverride } : userFilter
      const params = new URLSearchParams()
      if (filter.type !== 'all') params.append('type', filter.type)
      if (filter.status !== 'all') params.append('status', filter.status)
      if (filter.search) params.append('search', filter.search)

      const response = await fetch(`/api/access-control/users?${params}`)
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [userFilter])

  // Fetch gates
  const fetchGates = useCallback(async () => {
    try {
      const response = await fetch('/api/access-control/gates')
      const data = await response.json()
      setGates(data)
      if (data.length > 0 && !scanForm.gateId) {
        setScanForm(prev => ({ ...prev, gateId: data[0].id }))
      }
    } catch (error) {
      console.error('Error fetching gates:', error)
    }
  }, [scanForm.gateId])

  // Fetch access logs
  const fetchAccessLogs = useCallback(async () => {
    try {
      const response = await fetch('/api/access-control/access-logs')
      const data = await response.json()
      setAccessLogs(data)
    } catch (error) {
      console.error('Error fetching access logs:', error)
    }
  }, [])

  // Fetch all alerts
  const fetchAllAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/access-control/security-alerts?resolved=all')
      const data = await response.json()
      setAllAlerts(data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }, [])

  // Check auth and load data
  useEffect(() => {
    const init = async () => {
      // Check authentication first
      try {
        const authRes = await fetch('/api/auth/me')
        if (!authRes.ok) {
          window.location.href = '/login'
          return
        }
        const authData = await authRes.json()
        setAdminUser(authData.user)
      } catch {
        window.location.href = '/login'
        return
      }
      setAuthChecked(true)

      setLoading(true)
      // Seed data first
      await fetch('/api/access-control/seed', { method: 'POST' })
      // Then fetch all data
      await Promise.all([
        fetchDashboardData(),
        fetchUsers(),
        fetchGates(),
        fetchAccessLogs(),
        fetchAllAlerts()
      ])
      setLoading(false)
    }
    init()
  }, [fetchDashboardData, fetchUsers, fetchGates, fetchAccessLogs, fetchAllAlerts])

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  // Export users to CSV
  const handleExportUsers = () => {
    exportToCSV(
      users as unknown as Record<string, unknown>[],
      [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'userType', label: 'Type' },
        { key: 'department', label: 'Department' },
        { key: 'status', label: 'Status' },
        { key: 'rfidCardId', label: 'RFID Card' },
        { key: 'biometricId', label: 'Biometric ID' },
      ],
      'campus_users'
    )
    toast.success('Users exported to CSV')
  }

  // Export access logs to CSV
  const handleExportLogs = () => {
    const flatLogs = accessLogs.map(log => ({
      user: log.user?.name || 'Unknown',
      gate: log.gate.name,
      accessType: log.accessType,
      authMethod: log.authMethod,
      result: log.result,
      reason: log.reason || '',
      timestamp: new Date(log.timestamp).toLocaleString(),
    }))
    exportToCSV(
      flatLogs as unknown as Record<string, unknown>[],
      [
        { key: 'user', label: 'User' },
        { key: 'gate', label: 'Gate' },
        { key: 'accessType', label: 'Access Type' },
        { key: 'authMethod', label: 'Auth Method' },
        { key: 'result', label: 'Result' },
        { key: 'reason', label: 'Reason' },
        { key: 'timestamp', label: 'Timestamp' },
      ],
      'access_logs'
    )
    toast.success('Access logs exported to CSV')
  }

  // Filter change handlers - update state and fetch with new values
  const handleUserSearchChange = (search: string) => {
    const newFilter = { ...userFilter, search }
    setUserFilter(newFilter)
    // Directly fetch with complete filter params
    const params = new URLSearchParams()
    if (newFilter.type !== 'all') params.append('type', newFilter.type)
    if (newFilter.status !== 'all') params.append('status', newFilter.status)
    if (newFilter.search) params.append('search', newFilter.search)
    fetch(`/api/access-control/users?${params}`).then(r => r.json()).then(setUsers).catch(console.error)
  }

  const handleUserTypeChange = (type: string) => {
    const newFilter = { ...userFilter, type }
    setUserFilter(newFilter)
    const params = new URLSearchParams()
    if (newFilter.type !== 'all') params.append('type', newFilter.type)
    if (newFilter.status !== 'all') params.append('status', newFilter.status)
    if (newFilter.search) params.append('search', newFilter.search)
    fetch(`/api/access-control/users?${params}`).then(r => r.json()).then(setUsers).catch(console.error)
  }

  const handleUserStatusChange = (status: string) => {
    const newFilter = { ...userFilter, status }
    setUserFilter(newFilter)
    const params = new URLSearchParams()
    if (newFilter.type !== 'all') params.append('type', newFilter.type)
    if (newFilter.status !== 'all') params.append('status', newFilter.status)
    if (newFilter.search) params.append('search', newFilter.search)
    fetch(`/api/access-control/users?${params}`).then(r => r.json()).then(setUsers).catch(console.error)
  }

  // Auto refresh dashboard
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Create user
  const handleCreateUser = async () => {
    try {
      const res = await fetch('/api/access-control/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      if (res.ok) {
        toast.success(`User "${newUser.name}" created successfully`)
      } else {
        toast.error('Failed to create user')
      }
      setNewUser({ name: '', email: '', phone: '', userType: 'STUDENT', department: '', rfidCardId: '', biometricId: '' })
      fetchUsers()
      fetchDashboardData()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
    }
  }

  // Create gate
  const handleCreateGate = async () => {
    try {
      const res = await fetch('/api/access-control/gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGate)
      })
      if (res.ok) {
        toast.success(`Gate "${newGate.name}" created successfully`)
      } else {
        toast.error('Failed to create gate')
      }
      setNewGate({ name: '', location: '', gateType: 'MAIN' })
      fetchGates()
      fetchDashboardData()
    } catch (error) {
      console.error('Error creating gate:', error)
      toast.error('Failed to create gate')
    }
  }

  // Delete user
  const handleDeleteUser = async (id: string) => {
    try {
      await fetch(`/api/access-control/users/${id}`, { method: 'DELETE' })
      toast.success('User deleted')
      fetchUsers()
      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  // Process scan
  const handleScan = async () => {
    try {
      const response = await fetch('/api/access-control/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanForm)
      })
      const data = await response.json()
      setScanResult(data)
      if (data.result === 'GRANTED') {
        toast.success(`Access granted for ${data.user?.name || 'user'}`)
      } else {
        toast.error(`Access denied: ${data.reason || 'Unauthorized'}`)
      }
      fetchDashboardData()
      fetchAccessLogs()
    } catch (error) {
      console.error('Error processing scan:', error)
      toast.error('Scan failed')
    }
  }

  // Resolve alert
  const handleResolveAlert = async (id: string) => {
    try {
      await fetch(`/api/access-control/security-alerts/${id}/resolve`, { method: 'POST' })
      toast.success('Alert resolved')
      fetchAllAlerts()
      fetchDashboardData()
    } catch (error) {
      console.error('Error resolving alert:', error)
      toast.error('Failed to resolve alert')
    }
  }

  // Update gate status
  const handleUpdateGateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/access-control/gates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      toast.success(`Gate status updated to ${status}`)
      fetchGates()
      fetchDashboardData()
    } catch (error) {
      console.error('Error updating gate:', error)
      toast.error('Failed to update gate status')
    }
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'ONLINE':
      case 'GRANTED':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'INACTIVE':
      case 'OFFLINE':
      case 'DENIED':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'SUSPENDED':
      case 'MAINTENANCE':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      case 'PENDING':
      case 'LOCKED':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 text-white'
      case 'HIGH':
        return 'bg-orange-500 text-white'
      case 'MEDIUM':
        return 'bg-yellow-500 text-white'
      case 'LOW':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  // Chart data
  const userTypeData = stats ? [
    { name: 'Students', value: stats.usersByType.students, color: '#22c55e' },
    { name: 'Staff', value: stats.usersByType.staff, color: '#3b82f6' },
    { name: 'Faculty', value: stats.usersByType.faculty, color: '#8b5cf6' },
    { name: 'Visitors', value: stats.usersByType.visitors, color: '#f59e0b' }
  ] : []

  if (!authChecked || loading) {
    return <SkeletonDashboard />
  }

  // Pagination helpers
  const paginatedLogs = accessLogs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE)
  const totalLogPages = Math.max(1, Math.ceil(accessLogs.length / LOGS_PER_PAGE))

  return (
    <>
      <SolvikShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        adminUser={adminUser}
        alertCount={stats?.activeAlerts || 0}
        onRefresh={() => { fetchDashboardData(); fetchUsers(); fetchGates(); fetchAccessLogs(); fetchAllAlerts(); toast.info('Data refreshed') }}
        onLogout={handleLogout}
        onSearch={handleUserSearchChange}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <SolvikOverview stats={stats} gates={gates} hourlyData={hourlyData} onNavigate={setActiveTab} />

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Access Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-72">
                    <div className="space-y-3">
                      {recentLogs.map((log) => (
                        <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.result === 'GRANTED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                            {log.result === 'GRANTED' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{log.user?.name || 'Unknown User'}</p>
                            <p className="text-sm text-slate-500">{log.gate.name} • {log.authMethod}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={getStatusColor(log.result)}>
                              {log.result}
                            </Badge>
                            <p className="text-xs text-slate-400 mt-1">{formatTime(log.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Active Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-72">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <CheckCircle className="w-12 h-12 mb-2 text-green-500" />
                        <p>No active alerts</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {alerts.map((alert) => (
                          <Alert key={alert.id} className="border-l-4" style={{ borderLeftColor: alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'HIGH' ? '#f97316' : '#eab308' }}>
                            <div className="flex items-start justify-between">
                              <div>
                                <AlertTitle className="flex items-center gap-2">
                                  <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                                  {alert.title}
                                </AlertTitle>
                                <AlertDescription className="mt-1">{alert.description}</AlertDescription>
                                <p className="text-xs text-slate-400 mt-2">{formatDateTime(alert.timestamp)}</p>
                              </div>
                            </div>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-start sm:items-center">
                <Button variant="outline" size="sm" onClick={handleExportUsers}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Input
                  placeholder="Search users..."
                  value={userFilter.search}
                  onChange={(e) => handleUserSearchChange(e.target.value)}
                  className="w-full sm:w-64"
                />
                <Select value={userFilter.type} onValueChange={handleUserTypeChange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="STUDENT">Students</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                    <SelectItem value="FACULTY">Faculty</SelectItem>
                    <SelectItem value="VISITOR">Visitors</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter.status} onValueChange={handleUserStatusChange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new campus user account</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={newUser.name} onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={newUser.phone} onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="userType">User Type</Label>
                        <Select value={newUser.userType} onValueChange={(v) => setNewUser(prev => ({ ...prev, userType: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="STAFF">Staff</SelectItem>
                            <SelectItem value="FACULTY">Faculty</SelectItem>
                            <SelectItem value="VISITOR">Visitor</SelectItem>
                            <SelectItem value="SECURITY">Security</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="department">Department</Label>
                        <Input id="department" value={newUser.department} onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="rfid">RFID Card ID</Label>
                        <Input id="rfid" value={newUser.rfidCardId} onChange={(e) => setNewUser(prev => ({ ...prev, rfidCardId: e.target.value }))} placeholder="RF001" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="biometric">Biometric ID</Label>
                        <Input id="biometric" value={newUser.biometricId} onChange={(e) => setNewUser(prev => ({ ...prev, biometricId: e.target.value }))} placeholder="BIO001" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>RFID</TableHead>
                        <TableHead>Biometric</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.userType}</Badge>
                          </TableCell>
                          <TableCell>{user.department || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.rfidCardId ? (
                              <div className="flex items-center gap-1">
                                <CreditCard className="w-4 h-4 text-blue-500" />
                                <span className="font-mono text-sm">{user.rfidCardId}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {user.biometricId ? (
                              <div className="flex items-center gap-1">
                                <Fingerprint className="w-4 h-4 text-purple-500" />
                                <span className="font-mono text-sm">{user.biometricId}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-red-600 hover:bg-red-700">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gates Tab */}
          <TabsContent value="gates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gate Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Gate
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Gate</DialogTitle>
                    <DialogDescription>Register a new access gate</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="gateName">Gate Name</Label>
                      <Input id="gateName" value={newGate.name} onChange={(e) => setNewGate(prev => ({ ...prev, name: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" value={newGate.location} onChange={(e) => setNewGate(prev => ({ ...prev, location: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gateType">Gate Type</Label>
                      <Select value={newGate.gateType} onValueChange={(v) => setNewGate(prev => ({ ...prev, gateType: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MAIN">Main Gate</SelectItem>
                          <SelectItem value="SECONDARY">Secondary Gate</SelectItem>
                          <SelectItem value="PARKING">Parking Gate</SelectItem>
                          <SelectItem value="LIBRARY">Library Gate</SelectItem>
                          <SelectItem value="LABORATORY">Laboratory Gate</SelectItem>
                          <SelectItem value="EMERGENCY">Emergency Gate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateGate}>Create Gate</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gates.map((gate) => (
                <Card key={gate.id} className={gate.status === 'ONLINE' ? 'border-green-500/50' : gate.status === 'MAINTENANCE' ? 'border-yellow-500/50' : 'border-red-500/50'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <DoorOpen className="w-5 h-5" />
                        {gate.name}
                      </CardTitle>
                      {gate.status === 'ONLINE' ? (
                        <Wifi className="w-5 h-5 text-green-500" />
                      ) : gate.status === 'OFFLINE' ? (
                        <WifiOff className="w-5 h-5 text-red-500" />
                      ) : (
                        <Settings className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {gate.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline">{gate.gateType}</Badge>
                      <Badge className={getStatusColor(gate.status)}>{gate.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                      <span>Total Scans: {gate._count?.accessLogs || 0}</span>
                    </div>
                    <Select value={gate.status} onValueChange={(v) => handleUpdateGateStatus(gate.id, v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONLINE">Online</SelectItem>
                        <SelectItem value="OFFLINE">Offline</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="LOCKED">Locked</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Access Control Tab */}
          <TabsContent value="access-control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scan Simulator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="w-5 h-5 text-blue-500" />
                    Access Control Simulation
                  </CardTitle>
                  <CardDescription>Simulate RFID or Biometric scan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Select Gate</Label>
                    <Select value={scanForm.gateId} onValueChange={(v) => setScanForm(prev => ({ ...prev, gateId: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gate" />
                      </SelectTrigger>
                      <SelectContent>
                        {gates.filter(g => g.status === 'ONLINE').map((gate) => (
                          <SelectItem key={gate.id} value={gate.id}>
                            {gate.name} - {gate.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Scan Type</Label>
                    <Select value={scanForm.scanType} onValueChange={(v) => setScanForm(prev => ({ ...prev, scanType: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RFID">RFID Card</SelectItem>
                        <SelectItem value="BIOMETRIC">Biometric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Scan Data</Label>
                    <Input
                      value={scanForm.scanData}
                      onChange={(e) => setScanForm(prev => ({ ...prev, scanData: e.target.value.toUpperCase() }))}
                      placeholder={scanForm.scanType === 'RFID' ? 'Enter RFID ID (e.g., RF001)' : 'Enter Biometric ID (e.g., BIO001)'}
                    />
                  </div>
                  <Button onClick={handleScan} className="w-full" disabled={!scanForm.gateId || !scanForm.scanData}>
                    <Scan className="w-4 h-4 mr-2" />
                    Process Scan
                  </Button>
                </CardContent>
              </Card>

              {/* Scan Result */}
              <Card>
                <CardHeader>
                  <CardTitle>Scan Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {scanResult ? (
                    <div className="space-y-4">
                      <div className={`p-6 rounded-lg text-center ${scanResult.result === 'GRANTED' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                        {scanResult.result === 'GRANTED' ? (
                          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        ) : (
                          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        )}
                        <h3 className="text-2xl font-bold">{scanResult.result === 'GRANTED' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</h3>
                        {scanResult.reason && <p className="text-slate-500 mt-2">{scanResult.reason}</p>}
                      </div>
                      {scanResult.user && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <h4 className="font-medium mb-2">User Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="text-slate-500">Name:</span> {scanResult.user.name}</p>
                            <p><span className="text-slate-500">Type:</span> {scanResult.user.userType}</p>
                            <p><span className="text-slate-500">Email:</span> {scanResult.user.email}</p>
                            <p><span className="text-slate-500">Dept:</span> {scanResult.user.department}</p>
                          </div>
                        </div>
                      )}
                      {scanResult.gate && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <h4 className="font-medium mb-2">Gate Info</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="text-slate-500">Gate:</span> {scanResult.gate.name}</p>
                            <p><span className="text-slate-500">Location:</span> {scanResult.gate.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                      <Scan className="w-16 h-16 mb-4" />
                      <p>No scan performed yet</p>
                      <p className="text-sm">Use the form to simulate a scan</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Security Alerts</h2>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {allAlerts.filter(a => !a.resolved).length} Active
              </Badge>
            </div>

            <div className="space-y-4">
              {allAlerts.map((alert) => (
                <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                          alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                            alert.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                          }`}>
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                            <Badge variant="outline">{alert.alertType.replace(/_/g, ' ')}</Badge>
                            {alert.resolved && <Badge className="bg-green-500 text-white">Resolved</Badge>}
                          </div>
                          <h3 className="font-semibold">{alert.title}</h3>
                          <p className="text-sm text-slate-500 mt-1">{alert.description}</p>
                          <p className="text-xs text-slate-400 mt-2">{formatDateTime(alert.timestamp)}</p>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button variant="outline" size="sm" onClick={() => handleResolveAlert(alert.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6" id="reports-section">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h2 className="text-2xl font-bold">Reports</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs CSV
                </Button>
                <Button variant="outline" size="sm" onClick={printReport}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Access Success Rate</span>
                      <span className="text-sm font-medium">
                        {stats?.todayAccessLogs ? Math.round((stats.grantedToday / stats.todayAccessLogs) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={stats?.todayAccessLogs ? (stats.grantedToday / stats.todayAccessLogs) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Gate Availability</span>
                      <span className="text-sm font-medium">
                        {stats?.totalGates ? Math.round((stats.onlineGates / stats.totalGates) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={stats?.totalGates ? (stats.onlineGates / stats.totalGates) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">User Activation Rate</span>
                      <span className="text-sm font-medium">
                        {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={stats?.totalUsers ? (stats.activeUsers / stats.totalUsers) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Objectives Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Automated Access Control</p>
                      <p className="text-sm text-slate-500">RFID & Biometric authentication active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Campus Security</p>
                      <p className="text-sm text-slate-500">Real-time monitoring enabled</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Real-time Management</p>
                      <p className="text-sm text-slate-500">Live dashboard with instant alerts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Resource Optimization</p>
                      <p className="text-sm text-slate-500">Efficient gate management system</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Analytics & Intelligence</h2>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  const res = await fetch('/api/access-control/analytics')
                  const data = await res.json()
                  setAnalyticsData(data)
                  toast.success('Analytics refreshed')
                } catch {
                  toast.error('Failed to load analytics')
                }
              }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Analytics
              </Button>
            </div>

            {analyticsData ? (
              <>
                <WeeklyTrends data={analyticsData.weeklyTrends} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnomalyDetector anomalies={analyticsData.anomalies} />
                  <OccupancyTracker zones={analyticsData.zones} />
                </div>
                <PeakHoursHeatmap data={analyticsData.heatmap} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={BarChart3}
                    title="Load Analytics Data"
                    description="Click 'Refresh Analytics' above to load real-time analytics data from your access logs."
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* IoT Tab */}
          <TabsContent value="iot" className="space-y-6">
            <IoTMonitor />
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <h2 className="text-2xl font-bold mb-2">Campus Map</h2>
            <CampusMap gates={gates} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GateSchedule gates={gates} />
              <VisitorPass />
            </div>
          </TabsContent>

        </Tabs>
      </SolvikShell>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Customer Chatbot */}
      <Chatbot />
    </>
  )
}

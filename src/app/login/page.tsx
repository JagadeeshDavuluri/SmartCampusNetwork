'use client'

import { useState } from 'react'
import { Shield, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Login failed')
                setLoading(false)
                return
            }

            // Redirect to dashboard
            window.location.href = '/'
        } catch {
            setError('Network error. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
            }}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #10b981, transparent)' }}
                />
                <div
                    className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
                />
            </div>

            <div
                className="w-full max-w-md relative"
                style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
                }}
            >
                <div className="p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div
                            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.3)',
                            }}
                        >
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Smart Campus</h1>
                        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                            Access Control System — Admin Login
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm"
                            style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                            }}
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: '#cbd5e1' }}
                            >
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@campus.edu"
                                required
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                            />
                        </div>

                        <div>
                            <label
                                className="block text-sm font-medium mb-2"
                                style={{ color: '#cbd5e1' }}
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all"
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                    }}
                                    onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                                    style={{ color: '#64748b' }}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                            style={{
                                background:
                                    loading || !email || !password
                                        ? 'rgba(16, 185, 129, 0.3)'
                                        : 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                                boxShadow:
                                    loading || !email || !password
                                        ? 'none'
                                        : '0 8px 25px rgba(16, 185, 129, 0.3)',
                            }}
                        >
                            {loading ? (
                                <>
                                    <div
                                        className="w-4 h-4 border-2 rounded-full animate-spin"
                                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
                                    />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Hint */}
                    <div
                        className="mt-6 p-3 rounded-xl text-center text-xs"
                        style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc',
                        }}
                    >
                        Default: <strong>admin@campus.edu</strong> / <strong>admin123</strong>
                    </div>
                </div>
            </div>
        </div>
    )
}

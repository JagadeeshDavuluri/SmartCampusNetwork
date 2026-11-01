import { cookies } from 'next/headers'

const SESSION_COOKIE = 'campus_session'
const SECRET = 'smart-campus-secret-key-2024' // In production, use env var

// Simple hash using Web Crypto (no extra dependencies)
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + SECRET)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password)
    return passwordHash === hash
}

// Session management using signed cookies
export async function createSession(userId: string, email: string, name: string, role: string) {
    const sessionData = JSON.stringify({ userId, email, name, role, exp: Date.now() + 24 * 60 * 60 * 1000 })
    const encoder = new TextEncoder()
    const data = encoder.encode(sessionData + SECRET)
    const sigBuffer = await crypto.subtle.digest('SHA-256', data)
    const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    const token = Buffer.from(sessionData).toString('base64') + '.' + signature

    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: false, // Set true in production
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/',
    })
}

export async function verifySession(): Promise<{ userId: string; email: string; name: string; role: string } | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(SESSION_COOKIE)?.value
        if (!token) return null

        const [dataBase64, signature] = token.split('.')
        if (!dataBase64 || !signature) return null

        const sessionData = Buffer.from(dataBase64, 'base64').toString('utf-8')

        // Verify signature
        const encoder = new TextEncoder()
        const data = encoder.encode(sessionData + SECRET)
        const sigBuffer = await crypto.subtle.digest('SHA-256', data)
        const expectedSig = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

        if (signature !== expectedSig) return null

        const parsed = JSON.parse(sessionData)

        // Check expiration
        if (parsed.exp < Date.now()) return null

        return { userId: parsed.userId, email: parsed.email, name: parsed.name, role: parsed.role }
    } catch {
        return null
    }
}

export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}

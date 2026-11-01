import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const admin = await db.adminUser.findUnique({ where: { email } })

        if (!admin) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        const valid = await verifyPassword(password, admin.passwordHash)

        if (!valid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        await createSession(admin.id, admin.email, admin.name, admin.role)

        return NextResponse.json({
            success: true,
            user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

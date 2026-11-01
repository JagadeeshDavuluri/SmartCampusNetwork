import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    
    if (type && type !== 'all') {
      where.userType = type;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { rfidCardId: { contains: search } }
      ];
    }

    const users = await db.campusUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { accessLogs: true }
        }
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, userType, department, rfidCardId, biometricId } = body;

    const user = await db.campusUser.create({
      data: {
        name,
        email,
        phone,
        userType: userType || 'STUDENT',
        department,
        rfidCardId,
        biometricId,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

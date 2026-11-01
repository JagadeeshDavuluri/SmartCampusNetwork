import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (type && type !== 'all') {
      where.gateType = type;
    }

    const gates = await db.gate.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { accessLogs: true }
        }
      }
    });

    return NextResponse.json(gates);
  } catch (error) {
    console.error('Error fetching gates:', error);
    return NextResponse.json({ error: 'Failed to fetch gates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location, gateType } = body;

    const gate = await db.gate.create({
      data: {
        name,
        location,
        gateType: gateType || 'MAIN',
        status: 'ONLINE',
        lastOnline: new Date()
      }
    });

    return NextResponse.json(gate);
  } catch (error) {
    console.error('Error creating gate:', error);
    return NextResponse.json({ error: 'Failed to create gate' }, { status: 500 });
  }
}

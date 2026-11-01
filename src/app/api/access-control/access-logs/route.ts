import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = searchParams.get('result');
    const gateId = searchParams.get('gateId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    
    if (result && result !== 'all') {
      where.result = result;
    }
    
    if (gateId) {
      where.gateId = gateId;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const logs = await db.accessLog.findMany({
      where,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: true,
        gate: true
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching access logs:', error);
    return NextResponse.json({ error: 'Failed to fetch access logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gateId, accessType, authMethod, result, reason, deviceId } = body;

    const log = await db.accessLog.create({
      data: {
        userId,
        gateId,
        accessType: accessType || 'ENTRY',
        authMethod: authMethod || 'RFID',
        result: result || 'GRANTED',
        reason,
        deviceId,
        timestamp: new Date()
      },
      include: {
        user: true,
        gate: true
      }
    });

    // If denied, create a security alert
    if (result === 'DENIED') {
      await db.securityAlert.create({
        data: {
          alertType: 'UNAUTHORIZED_ACCESS',
          severity: 'MEDIUM',
          title: 'Access Denied',
          description: `Access denied for user ${log.user?.name || 'Unknown'} at gate ${log.gate.name}. Reason: ${reason || 'Not specified'}`,
          gateId,
          userId
        }
      });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating access log:', error);
    return NextResponse.json({ error: 'Failed to create access log' }, { status: 500 });
  }
}

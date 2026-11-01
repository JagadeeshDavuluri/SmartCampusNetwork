import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resolved = searchParams.get('resolved');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    
    if (resolved !== null && resolved !== 'all') {
      where.resolved = resolved === 'true';
    }
    
    if (severity && severity !== 'all') {
      where.severity = severity;
    }

    const alerts = await db.securityAlert.findMany({
      where,
      take: limit,
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertType, severity, title, description, gateId, userId } = body;

    const alert = await db.securityAlert.create({
      data: {
        alertType: alertType || 'UNAUTHORIZED_ACCESS',
        severity: severity || 'MEDIUM',
        title,
        description,
        gateId,
        userId
      }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const gateId = searchParams.get('gateId');

    const where: Record<string, unknown> = { isActive: true };
    
    if (userId) {
      where.userId = userId;
    }
    
    if (gateId) {
      where.gateId = gateId;
    }

    const authorizations = await db.authorization.findMany({
      where,
      include: {
        user: true,
        gate: true
      }
    });

    return NextResponse.json(authorizations);
  } catch (error) {
    console.error('Error fetching authorizations:', error);
    return NextResponse.json({ error: 'Failed to fetch authorizations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gateId, accessLevel, validFrom, validUntil, daysOfWeek, timeFrom, timeUntil } = body;

    const authorization = await db.authorization.create({
      data: {
        userId,
        gateId,
        accessLevel: accessLevel || 'STANDARD',
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        daysOfWeek,
        timeFrom,
        timeUntil,
        isActive: true
      },
      include: {
        user: true,
        gate: true
      }
    });

    return NextResponse.json(authorization);
  } catch (error) {
    console.error('Error creating authorization:', error);
    return NextResponse.json({ error: 'Failed to create authorization' }, { status: 500 });
  }
}

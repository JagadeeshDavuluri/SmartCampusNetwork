import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const alert = await db.securityAlert.update({
      where: { id },
      data: {
        resolved: true,
        resolvedAt: new Date()
      }
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
  }
}

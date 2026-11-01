import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gate = await db.gate.findUnique({
      where: { id },
      include: {
        accessLogs: {
          take: 20,
          orderBy: { timestamp: 'desc' },
          include: { user: true }
        },
        authorizations: {
          include: { user: true }
        }
      }
    });

    if (!gate) {
      return NextResponse.json({ error: 'Gate not found' }, { status: 404 });
    }

    return NextResponse.json(gate);
  } catch (error) {
    console.error('Error fetching gate:', error);
    return NextResponse.json({ error: 'Failed to fetch gate' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const gate = await db.gate.update({
      where: { id },
      data: body
    });

    return NextResponse.json(gate);
  } catch (error) {
    console.error('Error updating gate:', error);
    return NextResponse.json({ error: 'Failed to update gate' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.gate.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gate:', error);
    return NextResponse.json({ error: 'Failed to delete gate' }, { status: 500 });
  }
}

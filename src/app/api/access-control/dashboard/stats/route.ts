import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get counts
    const totalUsers = await db.campusUser.count();
    const activeUsers = await db.campusUser.count({
      where: { status: 'ACTIVE' }
    });
    const totalGates = await db.gate.count();
    const onlineGates = await db.gate.count({
      where: { status: 'ONLINE' }
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAccessLogs = await db.accessLog.count({
      where: {
        timestamp: { gte: today }
      }
    });

    const grantedToday = await db.accessLog.count({
      where: {
        timestamp: { gte: today },
        result: 'GRANTED'
      }
    });

    const deniedToday = await db.accessLog.count({
      where: {
        timestamp: { gte: today },
        result: 'DENIED'
      }
    });

    const activeAlerts = await db.securityAlert.count({
      where: { resolved: false }
    });

    // Get recent access logs
    const recentLogs = await db.accessLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: true,
        gate: true
      }
    });

    // Get active alerts
    const alerts = await db.securityAlert.findMany({
      where: { resolved: false },
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    // Get users by type
    const students = await db.campusUser.count({ where: { userType: 'STUDENT' } });
    const staff = await db.campusUser.count({ where: { userType: 'STAFF' } });
    const faculty = await db.campusUser.count({ where: { userType: 'FACULTY' } });
    const visitors = await db.campusUser.count({ where: { userType: 'VISITOR' } });

    // Get hourly access data for today
    const hourlyData: { hour: number; entries: number; exits: number }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(today);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(today);
      hourEnd.setHours(hour, 59, 59, 999);

      const entries = await db.accessLog.count({
        where: {
          timestamp: { gte: hourStart, lte: hourEnd },
          accessType: 'ENTRY',
          result: 'GRANTED'
        }
      });

      const exits = await db.accessLog.count({
        where: {
          timestamp: { gte: hourStart, lte: hourEnd },
          accessType: 'EXIT',
          result: 'GRANTED'
        }
      });

      hourlyData.push({ hour, entries, exits });
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        totalGates,
        onlineGates,
        todayAccessLogs,
        grantedToday,
        deniedToday,
        activeAlerts,
        usersByType: { students, staff, faculty, visitors }
      },
      recentLogs,
      alerts,
      hourlyData
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAllowedByRole, roleDenyReason } from '@/lib/access-policy';

// Simulate RFID/Biometric scan and authorization check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gateId, scanType, scanData } = body;

    // Find the gate
    const gate = await db.gate.findUnique({
      where: { id: gateId }
    });

    if (!gate) {
      return NextResponse.json({
        success: false,
        error: 'Gate not found'
      }, { status: 404 });
    }

    if (gate.status !== 'ONLINE') {
      return NextResponse.json({
        success: false,
        error: 'Gate is offline',
        reason: `Gate is ${String(gate.status).toLowerCase()}`,
        result: 'DENIED'
      });
    }

    // Find user by RFID or Biometric ID
    let user: Awaited<ReturnType<typeof db.campusUser.findFirst>> = null;
    if (scanType === 'RFID') {
      user = await db.campusUser.findFirst({
        where: { rfidCardId: scanData }
      });
    } else if (scanType === 'BIOMETRIC') {
      user = await db.campusUser.findFirst({
        where: { biometricId: scanData }
      });
    }

    if (!user) {
      // Log unauthorized attempt
      const log = await db.accessLog.create({
        data: {
          gateId,
          accessType: 'ENTRY',
          authMethod: scanType,
          result: 'DENIED',
          reason: 'User not found'
        }
      });

      // Create security alert
      await db.securityAlert.create({
        data: {
          alertType: 'UNAUTHORIZED_ACCESS',
          severity: 'MEDIUM',
          title: 'Unknown User Attempt',
          description: `Unknown ${scanType} scan attempted at ${gate.name}`,
          gateId
        }
      });

      return NextResponse.json({
        success: true,
        result: 'DENIED',
        reason: 'User not recognized',
        logId: log.id
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      const log = await db.accessLog.create({
        data: {
          userId: user.id,
          gateId,
          accessType: 'ENTRY',
          authMethod: scanType,
          result: 'DENIED',
          reason: `User status: ${user.status}`
        },
        include: { user: true, gate: true }
      });

      return NextResponse.json({
        success: true,
        result: 'DENIED',
        reason: `Account is ${user.status.toLowerCase()}`,
        user: { id: user.id, name: user.name },
        log
      });
    }

    // Check authorization for this gate
    const authorization = await db.authorization.findFirst({
      where: {
        userId: user.id,
        gateId,
        isActive: true
      }
    });

    // Check time-based access if authorization exists
    let isAuthorized = !!authorization;
    let denyReason = 'No authorization for this gate';

    // Role-based default: when no explicit rule exists for this gate, the user type decides.
    // An explicitly revoked (inactive) rule always wins over the role default.
    if (!authorization) {
      const revoked = await db.authorization.findFirst({
        where: { userId: user.id, gateId, isActive: false }
      });
      if (revoked) {
        denyReason = 'Access revoked for this gate';
      } else if (isAllowedByRole(user.userType, gate.gateType)) {
        isAuthorized = true;
      } else {
        denyReason = roleDenyReason(user.userType);
      }
    }

    if (authorization) {
      const now = new Date();

      // Check valid date range
      if (authorization.validFrom && now < authorization.validFrom) {
        isAuthorized = false;
        denyReason = 'Authorization not yet valid';
      }

      if (authorization.validUntil && now > authorization.validUntil) {
        isAuthorized = false;
        denyReason = 'Authorization expired';
      }

      // Check day of week
      if (authorization.daysOfWeek && isAuthorized) {
        const days = JSON.parse(authorization.daysOfWeek);
        const today = now.getDay();
        if (!days.includes(today)) {
          isAuthorized = false;
          denyReason = 'Access not allowed today';
        }
      }

      // Check time range
      if (authorization.timeFrom && authorization.timeUntil && isAuthorized) {
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (currentTime < authorization.timeFrom || currentTime > authorization.timeUntil) {
          isAuthorized = false;
          denyReason = 'Access not allowed at this time';
        }
      }
    }

    // Create access log
    const log = await db.accessLog.create({
      data: {
        userId: user.id,
        gateId,
        accessType: 'ENTRY',
        authMethod: scanType,
        result: isAuthorized ? 'GRANTED' : 'DENIED',
        reason: isAuthorized ? null : denyReason
      },
      include: { user: true, gate: true }
    });

    // Create security alert for denied access
    if (!isAuthorized) {
      await db.securityAlert.create({
        data: {
          alertType: 'UNAUTHORIZED_ACCESS',
          severity: 'LOW',
          title: 'Access Denied',
          description: `${user.name} denied access at ${gate.name}. Reason: ${denyReason}`,
          gateId,
          userId: user.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      result: isAuthorized ? 'GRANTED' : 'DENIED',
      reason: isAuthorized ? null : denyReason,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        department: user.department
      },
      gate: {
        id: gate.id,
        name: gate.name,
        location: gate.location
      },
      log
    });
  } catch (error) {
    console.error('Error processing scan:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process scan'
    }, { status: 500 });
  }
}

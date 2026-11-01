import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// Seed initial data
export async function POST() {
  try {
    // Seed admin user if not exists
    const existingAdmin = await db.adminUser.count();
    if (existingAdmin === 0) {
      const passwordHash = await hashPassword('admin123');
      await db.adminUser.create({
        data: {
          name: 'Campus Admin',
          email: 'admin@campus.edu',
          passwordHash,
          role: 'ADMIN',
        },
      });
    }

    // Check if data already exists
    const existingGates = await db.gate.count();
    if (existingGates > 0) {
      return NextResponse.json({
        success: true,
        message: 'Data already seeded',
        counts: { gates: existingGates }
      });
    }

    // Create gates
    const gates = await Promise.all([
      db.gate.create({
        data: { name: 'Main Gate', location: 'North Entrance', gateType: 'MAIN', status: 'ONLINE', lastOnline: new Date() }
      }),
      db.gate.create({
        data: { name: 'East Gate', location: 'East Wing', gateType: 'SECONDARY', status: 'ONLINE', lastOnline: new Date() }
      }),
      db.gate.create({
        data: { name: 'Library Gate', location: 'Library Building', gateType: 'LIBRARY', status: 'ONLINE', lastOnline: new Date() }
      }),
      db.gate.create({
        data: { name: 'Lab Gate', location: 'Science Building', gateType: 'LABORATORY', status: 'ONLINE', lastOnline: new Date() }
      }),
      db.gate.create({
        data: { name: 'Parking Gate', location: 'Parking Area', gateType: 'PARKING', status: 'MAINTENANCE', lastOnline: new Date() }
      })
    ]);

    // Create sample users
    const users = await Promise.all([
      db.campusUser.create({
        data: {
          name: 'John Smith',
          email: 'john.smith@campus.edu',
          phone: '555-0101',
          userType: 'STUDENT',
          department: 'Computer Science',
          rfidCardId: 'RF001',
          biometricId: 'BIO001',
          status: 'ACTIVE'
        }
      }),
      db.campusUser.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@campus.edu',
          phone: '555-0102',
          userType: 'FACULTY',
          department: 'Electronics',
          rfidCardId: 'RF002',
          biometricId: 'BIO002',
          status: 'ACTIVE'
        }
      }),
      db.campusUser.create({
        data: {
          name: 'Mike Williams',
          email: 'mike.williams@campus.edu',
          phone: '555-0103',
          userType: 'STAFF',
          department: 'Administration',
          rfidCardId: 'RF003',
          biometricId: 'BIO003',
          status: 'ACTIVE'
        }
      }),
      db.campusUser.create({
        data: {
          name: 'Emily Brown',
          email: 'emily.brown@campus.edu',
          phone: '555-0104',
          userType: 'STUDENT',
          department: 'Mechanical Engineering',
          rfidCardId: 'RF004',
          status: 'ACTIVE'
        }
      }),
      db.campusUser.create({
        data: {
          name: 'David Lee',
          email: 'david.lee@campus.edu',
          phone: '555-0105',
          userType: 'VISITOR',
          department: 'External',
          rfidCardId: 'RF005',
          status: 'ACTIVE'
        }
      }),
      db.campusUser.create({
        data: {
          name: 'James Wilson',
          email: 'james.wilson@campus.edu',
          phone: '555-0106',
          userType: 'SECURITY',
          department: 'Security',
          rfidCardId: 'RF006',
          biometricId: 'BIO006',
          status: 'ACTIVE'
        }
      }),
      db.campusUser.create({
        data: {
          name: 'Lisa Garcia',
          email: 'lisa.garcia@campus.edu',
          phone: '555-0107',
          userType: 'STUDENT',
          department: 'Computer Science',
          status: 'SUSPENDED'
        }
      })
    ]);

    // Create authorizations
    for (const user of users) {
      // Give all users access to main gate
      await db.authorization.create({
        data: {
          userId: user.id,
          gateId: gates[0].id,
          accessLevel: user.userType === 'SECURITY' ? 'FULL' : 'STANDARD',
          isActive: true
        }
      });

      // Give students access to library
      if (user.userType === 'STUDENT' || user.userType === 'FACULTY') {
        await db.authorization.create({
          data: {
            userId: user.id,
            gateId: gates[2].id,
            accessLevel: 'STANDARD',
            isActive: true
          }
        });
      }

      // Give faculty and staff access to lab
      if (user.userType === 'FACULTY' || user.userType === 'STAFF') {
        await db.authorization.create({
          data: {
            userId: user.id,
            gateId: gates[3].id,
            accessLevel: 'FULL',
            isActive: true
          }
        });
      }
    }

    // Create sample access logs
    const accessTypes = ['ENTRY', 'EXIT'];
    const authMethods = ['RFID', 'BIOMETRIC', 'BOTH'];
    const results = ['GRANTED', 'GRANTED', 'GRANTED', 'GRANTED', 'DENIED'];

    for (let i = 0; i < 30; i++) {
      const randomUser = users[Math.floor(Math.random() * (users.length - 1))]; // Exclude suspended user
      const randomGate = gates[Math.floor(Math.random() * gates.length)];
      const randomResult = results[Math.floor(Math.random() * results.length)];
      const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);

      await db.accessLog.create({
        data: {
          userId: randomResult === 'DENIED' && Math.random() > 0.5 ? null : randomUser.id,
          gateId: randomGate.id,
          accessType: accessTypes[Math.floor(Math.random() * accessTypes.length)] as 'ENTRY' | 'EXIT',
          authMethod: authMethods[Math.floor(Math.random() * authMethods.length)] as 'RFID' | 'BIOMETRIC' | 'BOTH',
          result: randomResult as 'GRANTED' | 'DENIED',
          reason: randomResult === 'DENIED' ? 'Unauthorized access attempt' : null,
          timestamp
        }
      });
    }

    // Create sample security alerts
    await db.securityAlert.create({
      data: {
        alertType: 'UNAUTHORIZED_ACCESS',
        severity: 'MEDIUM',
        title: 'Multiple Failed Access Attempts',
        description: 'Multiple failed access attempts detected at Main Gate',
        gateId: gates[0].id,
        resolved: false
      }
    });

    await db.securityAlert.create({
      data: {
        alertType: 'DEVICE_TAMPERING',
        severity: 'HIGH',
        title: 'Sensor Malfunction Detected',
        description: 'Biometric sensor at Lab Gate showing irregular readings',
        gateId: gates[3].id,
        resolved: false
      }
    });

    await db.securityAlert.create({
      data: {
        alertType: 'AFTER_HOURS_ACCESS',
        severity: 'LOW',
        title: 'Late Night Access',
        description: 'Access granted after midnight at East Gate',
        gateId: gates[1].id,
        resolved: true,
        resolvedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Seed data created successfully',
      counts: {
        gates: gates.length,
        users: users.length
      }
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Roles ──────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Full system access', isSystemRole: true },
    }),
    prisma.role.upsert({
      where: { name: 'HR_ADMIN' },
      update: {},
      create: { name: 'HR_ADMIN', description: 'Manages all employees, payroll, leave policy', isSystemRole: true },
    }),
    prisma.role.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: { name: 'MANAGER', description: 'Views/approves team leave & attendance', isSystemRole: true },
    }),
    prisma.role.upsert({
      where: { name: 'EMPLOYEE' },
      update: {},
      create: { name: 'EMPLOYEE', description: 'Access to own data', isSystemRole: true },
    }),
  ]);

  const [superAdmin, hrAdmin, manager, employee] = roles;
  console.log('  ✅ Roles created');

  // ─── Permissions ──────────────────────────────────────────────
  const permissionsData = [
    // Employee
    { resource: 'employee', action: 'read', scope: 'own' },
    { resource: 'employee', action: 'read', scope: 'team' },
    { resource: 'employee', action: 'read', scope: 'all' },
    { resource: 'employee', action: 'create', scope: null },
    { resource: 'employee', action: 'update', scope: 'own' },
    { resource: 'employee', action: 'update', scope: 'all' },
    { resource: 'employee', action: 'delete', scope: null },
    // Leave
    { resource: 'leave', action: 'apply', scope: null },
    { resource: 'leave', action: 'view', scope: 'own' },
    { resource: 'leave', action: 'view', scope: 'team' },
    { resource: 'leave', action: 'view', scope: 'all' },
    { resource: 'leave', action: 'approve', scope: 'team' },
    { resource: 'leave', action: 'approve', scope: 'all' },
    // Attendance
    { resource: 'attendance', action: 'checkin', scope: null },
    { resource: 'attendance', action: 'read', scope: 'own' },
    { resource: 'attendance', action: 'read', scope: 'team' },
    { resource: 'attendance', action: 'read', scope: 'all' },
    { resource: 'attendance', action: 'regularize', scope: null },
    // EOD
    { resource: 'eod', action: 'submit', scope: null },
    { resource: 'eod', action: 'read', scope: 'own' },
    { resource: 'eod', action: 'read', scope: 'team' },
    { resource: 'eod', action: 'read', scope: 'all' },
    // Payroll
    { resource: 'payroll', action: 'view', scope: 'own' },
    { resource: 'payroll', action: 'view', scope: 'all' },
    { resource: 'payroll', action: 'generate', scope: null },
    // Documents
    { resource: 'document', action: 'upload', scope: null },
    { resource: 'document', action: 'read', scope: 'own' },
    { resource: 'document', action: 'read', scope: 'all' },
    // Helpdesk
    { resource: 'helpdesk', action: 'create', scope: null },
    { resource: 'helpdesk', action: 'read', scope: 'own' },
    { resource: 'helpdesk', action: 'manage', scope: null },
    // Reports
    { resource: 'reports', action: 'view', scope: 'team' },
    { resource: 'reports', action: 'view', scope: 'all' },
    // Admin
    { resource: 'admin', action: 'manage_roles', scope: null },
    { resource: 'admin', action: 'settings', scope: null },
    { resource: 'audit', action: 'view', scope: null },
    // Dashboard
    { resource: 'dashboard', action: 'view', scope: 'own' },
    { resource: 'dashboard', action: 'view', scope: 'team' },
    { resource: 'dashboard', action: 'view', scope: 'all' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((p) =>
      prisma.permission.upsert({
        where: { resource_action_scope: { resource: p.resource, action: p.action, scope: p.scope ?? '' } },
        update: {},
        create: { resource: p.resource, action: p.action, scope: p.scope },
      })
    )
  );
  console.log('  ✅ Permissions created');

  // Helper to find permission ID
  const findPerm = (resource: string, action: string, scope: string | null) =>
    permissions.find(
      (p) => p.resource === resource && p.action === action && (p.scope ?? '') === (scope ?? '')
    )!.id;

  // ─── Role-Permission Mappings ──────────────────────────────────
  // EMPLOYEE role permissions
  const employeePerms = [
    findPerm('employee', 'read', 'own'),
    findPerm('employee', 'update', 'own'),
    findPerm('leave', 'apply', null),
    findPerm('leave', 'view', 'own'),
    findPerm('attendance', 'checkin', null),
    findPerm('attendance', 'read', 'own'),
    findPerm('attendance', 'regularize', null),
    findPerm('eod', 'submit', null),
    findPerm('eod', 'read', 'own'),
    findPerm('payroll', 'view', 'own'),
    findPerm('document', 'upload', null),
    findPerm('document', 'read', 'own'),
    findPerm('helpdesk', 'create', null),
    findPerm('helpdesk', 'read', 'own'),
    findPerm('dashboard', 'view', 'own'),
  ];

  // MANAGER role = EMPLOYEE + team-level
  const managerPerms = [
    ...employeePerms,
    findPerm('employee', 'read', 'team'),
    findPerm('leave', 'view', 'team'),
    findPerm('leave', 'approve', 'team'),
    findPerm('attendance', 'read', 'team'),
    findPerm('eod', 'read', 'team'),
    findPerm('reports', 'view', 'team'),
    findPerm('dashboard', 'view', 'team'),
  ];

  // HR_ADMIN = all data access
  const hrAdminPerms = [
    ...managerPerms,
    findPerm('employee', 'read', 'all'),
    findPerm('employee', 'create', null),
    findPerm('employee', 'update', 'all'),
    findPerm('employee', 'delete', null),
    findPerm('leave', 'view', 'all'),
    findPerm('leave', 'approve', 'all'),
    findPerm('attendance', 'read', 'all'),
    findPerm('eod', 'read', 'all'),
    findPerm('payroll', 'view', 'all'),
    findPerm('payroll', 'generate', null),
    findPerm('document', 'read', 'all'),
    findPerm('helpdesk', 'manage', null),
    findPerm('reports', 'view', 'all'),
    findPerm('dashboard', 'view', 'all'),
  ];

  // SUPER_ADMIN = everything
  const superAdminPerms = [
    ...hrAdminPerms,
    findPerm('admin', 'manage_roles', null),
    findPerm('admin', 'settings', null),
    findPerm('audit', 'view', null),
  ];

  // Deduplicate permission IDs
  const unique = (arr: string[]) => [...new Set(arr)];

  const roleMappings = [
    { roleId: employee.id, perms: unique(employeePerms) },
    { roleId: manager.id, perms: unique(managerPerms) },
    { roleId: hrAdmin.id, perms: unique(hrAdminPerms) },
    { roleId: superAdmin.id, perms: unique(superAdminPerms) },
  ];

  for (const mapping of roleMappings) {
    // Clear existing mappings first
    await prisma.rolePermission.deleteMany({ where: { roleId: mapping.roleId } });
    await prisma.rolePermission.createMany({
      data: mapping.perms.map((permId) => ({
        roleId: mapping.roleId,
        permissionId: permId,
      })),
    });
  }
  console.log('  ✅ Role-Permission mappings created');

  // ─── Departments & Designations ──────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: { name: 'Engineering' },
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: { name: 'Human Resources' },
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance' },
    }),
    prisma.department.upsert({
      where: { name: 'Operations' },
      update: {},
      create: { name: 'Operations' },
    }),
    prisma.department.upsert({
      where: { name: 'Sales' },
      update: {},
      create: { name: 'Sales' },
    }),
  ]);

  const [engDept, hrDept, finDept] = departments;

  const designations = await Promise.all([
    prisma.designation.upsert({
      where: { name_departmentId: { name: 'Software Developer', departmentId: engDept.id } },
      update: {},
      create: { name: 'Software Developer', departmentId: engDept.id },
    }),
    prisma.designation.upsert({
      where: { name_departmentId: { name: 'Senior Developer', departmentId: engDept.id } },
      update: {},
      create: { name: 'Senior Developer', departmentId: engDept.id },
    }),
    prisma.designation.upsert({
      where: { name_departmentId: { name: 'Engineering Manager', departmentId: engDept.id } },
      update: {},
      create: { name: 'Engineering Manager', departmentId: engDept.id },
    }),
    prisma.designation.upsert({
      where: { name_departmentId: { name: 'HR Manager', departmentId: hrDept.id } },
      update: {},
      create: { name: 'HR Manager', departmentId: hrDept.id },
    }),
    prisma.designation.upsert({
      where: { name_departmentId: { name: 'HR Executive', departmentId: hrDept.id } },
      update: {},
      create: { name: 'HR Executive', departmentId: hrDept.id },
    }),
    prisma.designation.upsert({
      where: { name_departmentId: { name: 'Finance Manager', departmentId: finDept.id } },
      update: {},
      create: { name: 'Finance Manager', departmentId: finDept.id },
    }),
  ]);

  const [devDesig, srDevDesig, engMgrDesig, hrMgrDesig, hrExecDesig] = designations;
  console.log('  ✅ Departments & Designations created');

  // ─── Leave Types ───────────────────────────────────────────────
  await Promise.all([
    prisma.leaveType.upsert({
      where: { name: 'Sick Leave' },
      update: {},
      create: { name: 'Sick Leave', defaultBalance: 12, carryForward: false },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Casual Leave' },
      update: {},
      create: { name: 'Casual Leave', defaultBalance: 12, carryForward: false },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Paid Leave' },
      update: {},
      create: { name: 'Paid Leave', defaultBalance: 15, carryForward: true, maxCarryDays: 5 },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Maternity Leave' },
      update: {},
      create: { name: 'Maternity Leave', defaultBalance: 182, carryForward: false },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Paternity Leave' },
      update: {},
      create: { name: 'Paternity Leave', defaultBalance: 15, carryForward: false },
    }),
  ]);
  console.log('  ✅ Leave Types created');

  // ─── Sample Employees + Users ──────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // Super Admin
  const adminEmployee = await prisma.employee.upsert({
    where: { email: 'admin@damodara.com' },
    update: {},
    create: {
      employeeCode: 'DST-001',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@damodara.com',
      phone: '9876543210',
      dateOfJoining: new Date('2024-01-01'),
      departmentId: engDept.id,
      designationId: engMgrDesig.id,
      gender: 'MALE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@damodara.com' },
    update: {},
    create: {
      email: 'admin@damodara.com',
      passwordHash,
      roleId: superAdmin.id,
      employeeId: adminEmployee.id,
    },
  });

  // HR Admin
  const hrEmployee = await prisma.employee.upsert({
    where: { email: 'hr@damodara.com' },
    update: {},
    create: {
      employeeCode: 'DST-002',
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'hr@damodara.com',
      phone: '9876543211',
      dateOfJoining: new Date('2024-03-15'),
      departmentId: hrDept.id,
      designationId: hrMgrDesig.id,
      gender: 'FEMALE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'hr@damodara.com' },
    update: {},
    create: {
      email: 'hr@damodara.com',
      passwordHash,
      roleId: hrAdmin.id,
      employeeId: hrEmployee.id,
    },
  });

  // Manager
  const mgrEmployee = await prisma.employee.upsert({
    where: { email: 'manager@damodara.com' },
    update: {},
    create: {
      employeeCode: 'DST-003',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'manager@damodara.com',
      phone: '9876543212',
      dateOfJoining: new Date('2024-06-01'),
      departmentId: engDept.id,
      designationId: engMgrDesig.id,
      gender: 'MALE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@damodara.com' },
    update: {},
    create: {
      email: 'manager@damodara.com',
      passwordHash,
      roleId: manager.id,
      employeeId: mgrEmployee.id,
    },
  });

  // Employee (Logeshwaran — matching existing prototype user)
  const empEmployee = await prisma.employee.upsert({
    where: { email: 'logesh@damodara.com' },
    update: {},
    create: {
      employeeCode: 'DST-004',
      firstName: 'Logeshwaran',
      lastName: 'S',
      email: 'logesh@damodara.com',
      phone: '9876543213',
      dateOfJoining: new Date('2025-01-15'),
      departmentId: engDept.id,
      designationId: devDesig.id,
      managerId: mgrEmployee.id,
      gender: 'MALE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'logesh@damodara.com' },
    update: {},
    create: {
      email: 'logesh@damodara.com',
      passwordHash,
      roleId: employee.id,
      employeeId: empEmployee.id,
    },
  });

  // Another employee for team depth
  const emp2Employee = await prisma.employee.upsert({
    where: { email: 'anita@damodara.com' },
    update: {},
    create: {
      employeeCode: 'DST-005',
      firstName: 'Anita',
      lastName: 'Patel',
      email: 'anita@damodara.com',
      phone: '9876543214',
      dateOfJoining: new Date('2025-04-01'),
      departmentId: engDept.id,
      designationId: srDevDesig.id,
      managerId: mgrEmployee.id,
      gender: 'FEMALE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'anita@damodara.com' },
    update: {},
    create: {
      email: 'anita@damodara.com',
      passwordHash,
      roleId: employee.id,
      employeeId: emp2Employee.id,
    },
  });

  console.log('  ✅ Sample Users & Employees created');

  // ─── Holidays ──────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const holidays = [
    { name: 'Republic Day', date: new Date(`${currentYear}-01-26`), year: currentYear },
    { name: 'Independence Day', date: new Date(`${currentYear}-08-15`), year: currentYear },
    { name: 'Gandhi Jayanti', date: new Date(`${currentYear}-10-02`), year: currentYear },
    { name: 'Diwali', date: new Date(`${currentYear}-10-20`), year: currentYear },
    { name: 'Christmas', date: new Date(`${currentYear}-12-25`), year: currentYear },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { date_name: { date: h.date, name: h.name } },
      update: {},
      create: { name: h.name, date: h.date, year: h.year, type: 'GENERAL' },
    });
  }
  console.log('  ✅ Holidays created');

  // ─── System Config ─────────────────────────────────────────────
  const configs = [
    { key: 'company_name', value: 'Damodara Smart Tec Pvt. Ltd' },
    { key: 'work_start_time', value: '08:00' },
    { key: 'work_end_time', value: '18:30' },
    { key: 'lunch_start', value: '13:30' },
    { key: 'lunch_end', value: '14:30' },
    { key: 'financial_year_start', value: 'April' },
  ];

  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      update: { value: c.value },
      create: { key: c.key, value: c.value },
    });
  }
  console.log('  ✅ System Config created');

  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Demo Credentials (all use password: Admin@123):');
  console.log('   Super Admin : admin@damodara.com');
  console.log('   HR Admin    : hr@damodara.com');
  console.log('   Manager     : manager@damodara.com');
  console.log('   Employee    : logesh@damodara.com');
  console.log('   Employee    : anita@damodara.com');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

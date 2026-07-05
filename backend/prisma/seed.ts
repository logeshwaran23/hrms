import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Roles
  const roleSuperAdmin = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Full system access',
      isSystemRole: true,
    },
  });
  
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrative access',
      isSystemRole: true,
    },
  });

  const roleHR = await prisma.role.upsert({
    where: { name: 'HR' },
    update: {},
    create: {
      name: 'HR',
      description: 'HR and Payroll access',
      isSystemRole: true,
    },
  });

  const roleManager = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Managerial access',
      isSystemRole: true,
    },
  });

  const roleEmployee = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Basic employee access',
      isSystemRole: true,
    },
  });

  // Department
  const dept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: { name: 'Engineering' },
  });

  // Designation
  let desig: any;
  const existingDesig = await prisma.designation.findFirst({ where: { name: 'Software Engineer' } });
  if (existingDesig) {
    desig = existingDesig;
  } else {
    desig = await prisma.designation.create({
      data: {
        name: 'Software Engineer',
        departmentId: dept.id,
      },
    });
  }

  // Helper function to create users
  async function createDemoUser(empCode: string, firstName: string, lastName: string, email: string, roleId: string) {
    const employee = await prisma.employee.upsert({
      where: { email },
      update: {},
      create: {
        employeeCode: empCode,
        firstName,
        lastName,
        email,
        departmentId: dept.id,
        designationId: desig.id,
        doj: new Date('2023-01-15T00:00:00Z'),
      },
    });

    await prisma.user.upsert({
      where: { email },
      update: { roleId },
      create: {
        email,
        passwordHash: 'any_password_hash',
        roleId,
        employeeId: employee.id,
      },
    });
  }

  // 1. Employee
  await createDemoUser('DST-004', 'Logeshwaran', 'S', 'logesh@damodara.com', roleEmployee.id);
  // 2. Manager
  await createDemoUser('DST-003', 'Arun', 'Patel', 'manager@damodara.com', roleManager.id);
  // 3. HR
  await createDemoUser('DST-002', 'Priya', 'Sharma', 'hr@damodara.com', roleHR.id);
  // 4. Admin
  await createDemoUser('DST-001', 'Rajesh', 'Kumar', 'admin@damodara.com', roleSuperAdmin.id);

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

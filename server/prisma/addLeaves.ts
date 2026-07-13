import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Adding 5 leaves to all user accounts...');
  const currentYear = new Date().getFullYear();
  
  // Find or create 'Casual Leave' type
  let leaveType = await prisma.leaveType.findUnique({
    where: { name: 'Casual Leave' }
  });
  
  if (!leaveType) {
    leaveType = await prisma.leaveType.create({
      data: { name: 'Casual Leave', defaultBalance: 12, carryForward: false }
    });
  }

  const employees = await prisma.employee.findMany();
  
  let count = 0;
  for (const emp of employees) {
    const existing = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: emp.id,
          leaveTypeId: leaveType.id,
          year: currentYear
        }
      }
    });

    if (existing) {
      await prisma.leaveBalance.update({
        where: { id: existing.id },
        data: {
          allocated: existing.allocated + 5,
          remaining: existing.remaining + 5
        }
      });
    } else {
      await prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveTypeId: leaveType.id,
          year: currentYear,
          allocated: 5,
          remaining: 5,
          used: 0
        }
      });
    }
    count++;
  }
  
  console.log(`✅ Successfully added 5 Casual Leaves to ${count} employees.`);
}

main()
  .catch((e) => {
    console.error('❌ Error adding leaves:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

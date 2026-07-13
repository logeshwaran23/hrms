import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a job posting
  const job = await prisma.jobPosting.create({
    data: {
      title: 'Frontend Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      status: 'ACTIVE',
      postedDate: new Date().toISOString(),
    }
  });

  // Create a candidate
  await prisma.candidate.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      jobId: job.id,
      status: 'SCREENING',
      appliedDate: new Date().toISOString(),
    }
  });

  await prisma.candidate.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      jobId: job.id,
      status: 'INTERVIEWING',
      appliedDate: new Date().toISOString(),
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

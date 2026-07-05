const prisma = require('../../config/db');

exports.getDashboard = async (req, res) => {
  const user = req.user;
  if (!user || !user.employee) return res.status(401).json({ success: false });

  const empId = user.employee.id;
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const attendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: { employeeId: empId, date: todayStr }
    }
  });

  const present = attendance ? (attendance.status === 'PRESENT' || attendance.checkIn != null) : false;
  const completed = attendance ? attendance.checkOut != null : false;
  
  // Calculate total working days vs present days using Prisma
  const allAtt = await prisma.attendance.findMany({ where: { employeeId: empId } });
  const presentDays = allAtt.filter(a => a.status === 'PRESENT').length;

  const data = {
    attendance: {
      present,
      completed,
      checkIn: attendance?.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : null,
      checkOut: attendance?.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : null,
      workHours: attendance?.workHours ?? 0,
      status: present ? 'PRESENT' : 'ABSENT',
    },
    leaveBalance: 12, // Default mock for now
    monthlyStats: { presentDays, totalWorkHours: 0, workingDays: 22 },
    notifications: [],
    pendingLeaves: 0,
  };

  res.json({ success: true, data });
};

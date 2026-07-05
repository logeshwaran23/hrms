const prisma = require('../../config/db');

exports.checkIn = async (req, res) => {
  const user = req.user;
  if (!user || !user.employee) return res.status(401).json({ success: false });

  const empId = user.employee.id;
  const todayStr = new Date().toISOString().slice(0, 10);
  
  let att = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: empId, date: todayStr } }
  });

  if (att && att.checkIn) return res.status(400).json({ success: false, message: 'Already checked in' });

  att = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: empId, date: todayStr } },
    update: { checkIn: new Date(), status: 'PRESENT' },
    create: { employeeId: empId, date: todayStr, checkIn: new Date(), status: 'PRESENT' }
  });

  res.json({ success: true, message: 'Checked in successfully!' });
};

exports.checkOut = async (req, res) => {
  const user = req.user;
  if (!user || !user.employee) return res.status(401).json({ success: false });

  const empId = user.employee.id;
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const att = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: empId, date: todayStr } }
  });

  if (!att || !att.checkIn) return res.status(400).json({ success: false, message: 'Not checked in' });

  const workHours = (Date.now() - new Date(att.checkIn).getTime()) / 3600000;

  await prisma.attendance.update({
    where: { id: att.id },
    data: { checkOut: new Date(), workHours }
  });

  res.json({ success: true, message: 'Checked out successfully!' });
};

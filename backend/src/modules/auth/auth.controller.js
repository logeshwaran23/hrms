const prisma = require('../../config/db');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, employee: true }
  });

  // Mocking real password check for now
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  res.json({
    success: true,
    accessToken: 'mock-access-' + user.id,
    refreshToken: 'mock-refresh-' + user.id,
    user: {
      id: user.id,
      email: user.email,
      role: user.role.name,
      employee: user.employee ? {
        id: user.employee.id,
        firstName: user.employee.firstName,
        lastName: user.employee.lastName,
        name: `${user.employee.firstName} ${user.employee.lastName}`,
      } : null,
    },
  });
};

exports.me = async (req, res) => {
  res.json({ success: true, user: req.user });
};

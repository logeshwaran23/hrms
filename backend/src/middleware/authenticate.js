const prisma = require('../config/db');

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || '';
  const userId = token.replace('mock-access-', '');
  
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, employee: true }
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  req.user = user;
  next();
}

module.exports = authenticate;

const jsonwebtoken = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authorization token missing'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid or expired token'
    });
  }
};

module.exports = authenticateToken;

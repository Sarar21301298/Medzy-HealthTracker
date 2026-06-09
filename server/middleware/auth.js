import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'medsy_secret_key_2024';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // Ensure user.id is properly set for MongoDB ObjectId compatibility
    req.user = {
      ...user,
      id: user.id || user._id // Handle both id and _id cases
    };
    
    next();
  });
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireAdmin = requireRole(['admin']);
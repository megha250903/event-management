import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token can be sent as "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No authentication token provided.' 
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_event_manager_token_key_123!@#';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Contains id, email, name
    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired authentication token.' 
    });
  }
};

const jwt = require('jsonwebtoken');

// same secret used in routes/auth.js
const JWT_SECRET = 'RamonDev5'; 

// Middleware to validate token and UID
module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Validate token with secret
    const decoded = jwt.verify(token, JWT_SECRET);
    // add decoded payload to the request
    req.user = decoded; 
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};
// Import jsonwebtoken to verify the login token
const jwt = require('jsonwebtoken');

// This function runs before any protected route
// It checks if the user has a valid token
const protect = (req, res, next) => {

  // Get the token from the request header
  const authHeader = req.headers.authorization;

  // If no token provided, deny access
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  // Extract the actual token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using our secret key
    // If valid, it returns the user info we stored inside it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request so routes can use it
    req.user = decoded;

    // Move on to the actual route
    next();

  } catch (err) {
    // Token is invalid or expired
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

module.exports = protect;
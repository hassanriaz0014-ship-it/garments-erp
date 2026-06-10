// Import express and create a router
const express = require('express');
const router = express.Router();

// bcryptjs is used to check hashed passwords securely
const bcrypt = require('bcryptjs');

// jsonwebtoken creates a login token so user stays logged in
const jwt = require('jsonwebtoken');

// Import database connection
const db = require('../db');

// LOGIN ROUTE — POST /api/auth/login
// When user submits username and password, this runs
router.post('/login', async (req, res) => {

  // Extract username and password from the request
  const { username, password } = req.body;

  try {
    // Search for the user in the database
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1', [username]
    );

    // If no user found, return error
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Compare entered password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create a token valid for 7 days
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send token and user info back to the app
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
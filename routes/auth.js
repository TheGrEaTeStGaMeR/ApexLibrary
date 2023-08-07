// routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username });
    await User.register(user, password);
    res.redirect('/');
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login route
router.post('/login', passport.authenticate('local', {
  successRedirect: '/', 
  failureRedirect: '/login', // Redirect to the login page if login fails
}));

// Logout route
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/'); // Redirect to the home page after logout
  });

module.exports = router;

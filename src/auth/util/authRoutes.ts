// authRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../util/authMiddleware');

router.get('/check', verifyToken, (req, res) => {
  // If the middleware function verifies the token, the user information will be available in req.user
  const user = req.user;
  // Here you can perform any additional logic with the user information if needed
  res.status(200).json({ user });
});

module.exports = router;

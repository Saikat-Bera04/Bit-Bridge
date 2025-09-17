const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Disabled - using wallet-only authentication
// router.post('/login', async (req, res) => {
//   res.status(404).json({ error: 'Email/password login disabled - use wallet connection only' });
// });

// Disabled - frontend uses wallet data directly
// router.post('/wallet-login', async (req, res) => {
//   res.status(404).json({ error: 'Wallet login disabled - frontend handles wallet data directly' });
// });

// Disabled - frontend uses wallet data directly
// router.get('/profile', authenticateToken, async (req, res) => {
//   res.status(404).json({ error: 'Profile endpoint disabled - frontend uses wallet data directly' });
// });

// Disabled - frontend manages wallet data directly
// router.put('/profile', authenticateToken, async (req, res) => {
//   res.status(404).json({ error: 'Profile update disabled - frontend manages wallet data directly' });
// });

// Disabled - frontend handles logout directly
// router.post('/logout', authenticateToken, async (req, res) => {
//   res.json({ success: true, message: 'Logout handled by frontend' });
// });

module.exports = router;

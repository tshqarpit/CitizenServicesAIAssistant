const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const rateLimit = require('express-rate-limit');
const jsonwebtoken = require('jsonwebtoken');

// Rate limiting for OTP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many OTP requests from this IP, please try again later.' }
});

router.post('/request-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) throw error;

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Request OTP Error:', error);
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      return res.status(429).json({ error: 'Email rate limit exceeded. Please wait an hour or try a different email.' });
    }
    res.status(500).json({ error: 'Unable to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, token } = req.body;

  if (!email || !token) {
    return res.status(400).json({ error: 'Email and token are required' });
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) throw error;

    // Generate JWT
    const jwtToken = jsonwebtoken.sign(
      {
        userId: data.user.id,
        email: data.user.email
      },
      process.env.JWT_SECRET || 'fallback_secret',
      {
        expiresIn: '7d'
      }
    );

    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(401).json({ error: 'Invalid or expired OTP' });
  }
});

module.exports = router;

// server/routes/auth.js - FIXED VERSION
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the User model
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendPasswordReset, sendPasswordChangedConfirmation } from '../utils/emailService.js';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      phone: phone || '',
      role: 'user',
      isActive: true
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Register initial admin (public only if no admin exists)
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const adminCount = await User.countDocuments({ role: 'admin' });

    // If an admin already exists, require an admin token to create another
    if (adminCount > 0) {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(403).json({ success: false, message: 'Admin registration is restricted' });
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        if (!decoded || decoded.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Only admins can create new admin accounts' });
        }
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid admin token' });
      }
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'admin',
      isActive: true
    });

    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({ success: true, message: 'Admin registration successful', token, user: userResponse });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// Forgot password - request reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ success: true, message: 'If the email exists, a reset link has been sent' });

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Build reset link that lands on the admin sign-in page with reset params
    // Prefer explicit ADMIN_SIGNIN_URL. If not provided, derive from ADMIN_URL
    // - strip any trailing '/admin' segment
    // - if ADMIN_URL points to localhost:3000 (client), switch to :3001
    let signinBase = process.env.ADMIN_SIGNIN_URL;
    if (!signinBase) {
      let adminUrl = process.env.ADMIN_URL || 'http://localhost:3001';
      // remove trailing slash
      adminUrl = adminUrl.replace(/\/$/, '');
      // If someone set ADMIN_URL to include '/admin', strip it
      adminUrl = adminUrl.replace(/\/admin\/?$/i, '');
      // If ADMIN_URL points to dev client on port 3000, switch to 3001 for admin
      adminUrl = adminUrl.replace(':3000', ':3001');
      signinBase = adminUrl + '/signin';
    }

    const resetLink = `${signinBase}?reset=true&token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send email
    await sendPasswordReset({ name: user.name, email: user.email, resetLink });

    return res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request', error: error.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ success: false, message: 'Missing required fields' });

    const user = await User.findOne({ email: email.toLowerCase(), resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // send confirmation
    await sendPasswordChangedConfirmation({ name: user.name, email: user.email });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
  }
});

// Login
// In /server/routes/auth.js - Update login response
// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user - NOW INCLUDES CLIENTS TOO!
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    // Add role-specific data
    if (user.role === 'client' && user.clientInfo) {
      userResponse.company = user.clientInfo.company;
      userResponse.clientStatus = user.clientInfo.clientStatus;
      userResponse.budget = user.clientInfo.budget;
    }

    if (user.role === 'agent' && user.agentInfo) {
      userResponse.licenseNumber = user.agentInfo.licenseNumber;
      userResponse.experience = user.agentInfo.experience;
      userResponse.commissionRate = user.agentInfo.commissionRate;
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Verify Token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;

// server/routes/clientAuth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import Client from '../models/Client.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Client auth routes are working!'
  });
});

// Client Login
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

    // Find client
    const client = await Client.findOne({ email: email.toLowerCase() });
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if client is active
    if (!client.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    client.lastLogin = new Date();
    await client.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        clientId: client._id, 
        email: client.email, 
        role: 'client',
        userType: 'client'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return client data without password
    const clientResponse = {
      id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      role: client.role,
      status: client.status,
      isActive: client.isActive,
      preferences: client.preferences,
      lastLogin: client.lastLogin
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: clientResponse,
      userType: 'client' // Important: differentiate from regular user
    });

  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Client Register (if you want clients to self-register)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, company } = req.body;

    // Validate input
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    // Check if client exists
    const existingClient = await Client.findOne({ email: email.toLowerCase() });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client with this email already exists'
      });
    }

    // Create client
    const client = new Client({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      company: company || '',
      role: 'client',
      status: 'active',
      isActive: true
    });

    await client.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        clientId: client._id, 
        email: client.email, 
        role: 'client',
        userType: 'client'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return client data without password
    const clientResponse = {
      id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      role: client.role,
      status: client.status,
      isActive: client.isActive
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: clientResponse,
      userType: 'client'
    });

  } catch (error) {
    console.error('Client registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Client Verify Token
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
    
    // Check if it's a client token
    if (decoded.userType !== 'client') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }
    
    // Find client
    const client = await Client.findById(decoded.clientId).select('-password');
    
    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        role: client.role,
        status: client.status,
        isActive: client.isActive,
        userType: 'client'
      }
    });

  } catch (error) {
    console.error('Client token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

export default router;
import bcrypt from 'bcryptjs';
import express from 'express';
import Client from '../models/Client.js';
const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const clients = await Client.find().limit(parseInt(limit)).sort({ createdAt: -1 });
    res.json({ clients, total: clients.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get client profile
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select('-password');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create client
// Add client - UPDATED
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, status, password } = req.body;
    console.log('Creating client with data:', req.body);
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email and phone are required' 
      });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client with this email already exists' 
      });
    }
    const client = new Client({
      name,
      email,
      phone,
      company: company || '',
      password,
      status: status || 'active'
    });
    await client.save();
    console.log('Client saved successfully:', client._id);
    res.status(201).json({
      success: true,
      client: {
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        status: client.status,
        createdAt: client.createdAt
      },
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Client creation error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, company, password } = req.body;
    let updateData = { name, email, phone, company };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

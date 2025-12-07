// server/routes/clients.js - COMPLETE FILE

import express from 'express';
import Client from '../models/Client.js';
const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const clients = await Client.find()
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json({
      clients,
      total: await Client.countDocuments(),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add client
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, status } = req.body;
    
    const client = new Client({
      name,
      email,
      password: req.body.password,
      phone,
      company,
      status: status || 'active'
    });
    
    await client.save();
    
    res.status(201).json({
      _id: client._id,
      name: client.name,
      email: client.email,
      password: client.password,
      phone: client.phone,
      company: client.company,
      status: client.status,
      createdAt: client.createdAt,
      message: 'Client created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }
    
    res.json({
      success: true,
      client,
      message: 'Client updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findByIdAndDelete(id);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Client not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Client deleted successfully',
      _id: id
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;
import express from 'express';
import Message from '../models/Message.js';

const router = express.Router();

// Send message
router.post('/', async (req, res) => {
  try {
    const message = await Message.create(req.body);
    res.status(201).json(message);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get messages for property
router.get('/property/:propertyId', async (req, res) => {
  const messages = await Message.find({ property: req.params.propertyId });
  res.json(messages);
});

export default router;

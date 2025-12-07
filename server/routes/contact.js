import express from 'express';
import { sendAdminContact } from '../utils/emailService.js';

const router = express.Router();

// Quick health endpoint for testing route registration
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Contact route is registered. Use POST /api/contact to send messages.' });
});

// Public contact endpoint - sends an email to ADMIN_EMAIL
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!message || (!email && !name)) {
      return res.status(400).json({ success: false, message: 'Please provide at least a message and contact email or name.' });
    }

    const result = await sendAdminContact({ name, email, phone, subject, message });

    if (!result || result.success === false) {
      return res.status(500).json({ success: false, message: 'Failed to send message', error: result?.error || 'unknown' });
    }

    return res.json({ success: true, message: 'Message sent to admin successfully' });
  } catch (error) {
    console.error('Error in /api/contact:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;

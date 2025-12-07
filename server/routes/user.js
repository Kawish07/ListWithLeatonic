// server/routes/users.js
import express from 'express';
import Property from '../models/Property.js';
import Lead from '../models/Lead.js';
const router = express.Router();

// Get user dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // In real app, get user ID from auth middleware
    const userId = req.userId || 'demo-user-id';
    
    // Get user's properties
    const properties = await Property.find({ owner: userId });
    
    // Get leads for user's properties
    const propertyIds = properties.map(p => p._id);
    const leads = await Lead.find({ propertyId: { $in: propertyIds } });
    
    const stats = {
      totalProperties: properties.length,
      totalLeads: leads.length,
      activeLeads: leads.filter(l => l.status === 'established').length,
      pendingLeads: leads.filter(l => l.status === 'pending').length
    };

    const recentLeads = await Lead.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'title price')
      .sort({ createdAt: -1 })
      .limit(5);

    const myProperties = await Property.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats,
      recentLeads: recentLeads.map(lead => ({
        _id: lead._id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        propertyTitle: lead.propertyId?.title,
        status: lead.status,
        createdAt: lead.createdAt
      })),
      myProperties
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's properties
router.get('/properties/my-properties', async (req, res) => {
  try {
    const userId = req.userId || 'demo-user-id';
    
    const properties = await Property.find({ owner: userId })
      .sort({ createdAt: -1 });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's leads
router.get('/leads', async (req, res) => {
  try {
    const userId = req.userId || 'demo-user-id';
    
    // Get user's property IDs
    const properties = await Property.find({ owner: userId });
    const propertyIds = properties.map(p => p._id);
    
    const leads = await Lead.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'title price')
      .sort({ createdAt: -1 });

    res.json(leads.map(lead => ({
      _id: lead._id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      propertyTitle: lead.propertyId?.title,
      propertyPrice: lead.propertyId?.price,
      status: lead.status,
      createdAt: lead.createdAt
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update lead status
router.put('/leads/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
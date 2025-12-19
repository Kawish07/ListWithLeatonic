
import express from 'express';
import Property from '../models/Property.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// Get all agents for lead assignment
router.get('/agents', async (req, res) => {
  try {
    // Find all users with role 'agent'
    const agents = await User.find({ role: 'agent', isActive: true })
      .select('name email address agentInfo');
    console.log('Fetched agents:', agents);
    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Admin dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [totalProperties, totalClients, pendingProperties, activeUsers, totalLeads, totalRevenue] = await Promise.all([
      Property.countDocuments(),
      Client.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      User.countDocuments({ isActive: true }),
      Lead.countDocuments(),
      Property.aggregate([
        { $match: { status: { $in: ['published', 'sold', 'rented'] } } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]).then(r => r[0]?.total || 0)
    ]);

    // Calculate monthly growth
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [propertiesThisMonth, propertiesLastMonth] = await Promise.all([
      Property.countDocuments({ 
        createdAt: { $gte: startOfMonth } 
      }),
      Property.countDocuments({ 
        createdAt: { 
          $gte: startOfLastMonth, 
          $lt: endOfLastMonth 
        } 
      })
    ]);

    const monthlyGrowth = propertiesLastMonth > 0 
      ? ((propertiesThisMonth - propertiesLastMonth) / propertiesLastMonth * 100).toFixed(1)
      : propertiesThisMonth > 0 ? 100 : 0;

    res.json({
      totalProperties,
      totalClients,
      pendingProperties,
      activeUsers,
      totalLeads,
      totalRevenue,
      monthlyGrowth: parseFloat(monthlyGrowth)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
});

// Leads chart (last 30 days)
router.get('/dashboard/leads-chart', async (req, res) => {
  try {
    const today = new Date();
    const days = 30;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      
      const count = await Lead.countDocuments({ 
        createdAt: { $gte: start, $lte: end } 
      });
      
      data.push({ 
        date: start.toISOString().split('T')[0], 
        leads: count 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching leads chart:', error);
    res.status(500).json([]);
  }
});

// Leads summary - last 7 days (per day counts + list of leads)
router.get('/dashboard/leads-week', async (req, res) => {
  try {
    const today = new Date();
    const start = new Date();
    start.setHours(0,0,0,0);
    start.setDate(today.getDate() - 6); // last 7 days including today

    const agg = await Lead.aggregate([
      { $match: { createdAt: { $gte: start, $lte: today } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const perDay = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0,10);
      const found = agg.find(a => a._id === key);
      perDay.push({ date: key, count: found ? found.count : 0 });
    }

    const total = perDay.reduce((s, p) => s + p.count, 0);

    // Also compute assigned counts (assignedTo != null) per day and total
    const assignedPerDay = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23,59,59,999);

      const assignedCount = await Lead.countDocuments({
        assignedTo: { $ne: null },
        $or: [
          { createdAt: { $gte: dayStart, $lte: dayEnd } },
          { updatedAt: { $gte: dayStart, $lte: dayEnd } }
        ]
      });

      assignedPerDay.push({ date: dayStart.toISOString().slice(0,10), count: assignedCount });
    }

    const assignedTotal = assignedPerDay.reduce((s, p) => s + p.count, 0);

    const leads = await Lead.find({ createdAt: { $gte: start, $lte: today } })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('assignedTo', 'name email');

    res.json({ success: true, total, perDay, leads, assignedTotal, assignedPerDay });
  } catch (error) {
    console.error('Error fetching weekly leads summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Leads summary - last 30 days (per day counts + list of leads)
router.get('/dashboard/leads-month', async (req, res) => {
  try {
    const today = new Date();
    const start = new Date();
    start.setHours(0,0,0,0);
    start.setDate(today.getDate() - 29); // last 30 days including today

    const agg = await Lead.aggregate([
      { $match: { createdAt: { $gte: start, $lte: today } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const perDay = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0,10);
      const found = agg.find(a => a._id === key);
      perDay.push({ date: key, count: found ? found.count : 0 });
    }

    const total = perDay.reduce((s, p) => s + p.count, 0);

    // Also compute assigned counts (assignedTo != null) per day and total
    const assignedPerDay = [];
    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + i);
      dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23,59,59,999);

      const assignedCount = await Lead.countDocuments({
        assignedTo: { $ne: null },
        $or: [
          { createdAt: { $gte: dayStart, $lte: dayEnd } },
          { updatedAt: { $gte: dayStart, $lte: dayEnd } }
        ]
      });

      assignedPerDay.push({ date: dayStart.toISOString().slice(0,10), count: assignedCount });
    }

    const assignedTotal = assignedPerDay.reduce((s, p) => s + p.count, 0);

    const leads = await Lead.find({ createdAt: { $gte: start, $lte: today } })
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('assignedTo', 'name email');

    res.json({ success: true, total, perDay, leads, assignedTotal, assignedPerDay });
  } catch (error) {
    console.error('Error fetching monthly leads summary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// New users chart
router.get('/dashboard/new-users', async (req, res) => {
  try {
    const today = new Date();
    const days = 30;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      
      const count = await User.countDocuments({ 
        createdAt: { $gte: start, $lte: end } 
      });
      
      data.push({ 
        date: start.toISOString().split('T')[0], 
        users: count 
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching new users chart:', error);
    res.status(500).json([]);
  }
});

// Contacts source chart
router.get('/dashboard/contacts-source', async (req, res) => {
  try {
    const sourceData = await Lead.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const colors = {
      'website': '#2c43f5',
      'phone': '#10B981',
      'email': '#EF4444',
      'social': '#F59E0B',
      'referral': '#8B5CF6',
      'other': '#6B7280'
    };

    const data = sourceData.map(item => ({
      name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Other',
      value: item.count,
      color: colors[item._id] || colors.other
    }));

    res.json(data);
  } catch (error) {
    console.error('Error fetching contacts source:', error);
    res.status(500).json([]);
  }
});

// Properties status chart
router.get('/dashboard/properties-status', async (req, res) => {
  try {
    const statuses = ['published', 'pending', 'rejected', 'sold', 'rented'];
    const colors = {
      'published': '#10B981',
      'pending': '#F59E0B',
      'rejected': '#EF4444',
      'sold': '#3B82F6',
      'rented': '#8B5CF6',
      'draft': '#6B7280'
    };
    
    // Get counts for all statuses
    const statusCounts = await Promise.all(
      statuses.map(async (status) => {
        const count = await Property.countDocuments({ status });
        return {
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
          color: colors[status] || '#9CA3AF'
        };
      })
    );

    // Filter out statuses with 0 counts for cleaner chart
    const data = statusCounts.filter(item => item.value > 0);

    res.json(data);
  } catch (error) {
    console.error('Error fetching properties status:', error);
    res.status(500).json([]);
  }
});

// Revenue chart (last 6 months)
router.get('/dashboard/revenue', async (req, res) => {
  try {
    const now = new Date();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const month = d.toLocaleString('default', { month: 'short' });
      
      const revenue = await Property.aggregate([
        { 
          $match: { 
            createdAt: { $gte: d, $lt: next },
            status: { $in: ['published', 'sold', 'rented'] }
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: "$price" }
          } 
        }
      ]);
      
      data.push({
        month,
        revenue: revenue[0]?.total || 0
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    res.status(500).json([]);
  }
});

// Recent activities
router.get('/dashboard/recent-activities', async (req, res) => {
  try {
    const [recentProperties, recentUsers, recentLeads] = await Promise.all([
      Property.find()
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .limit(3),
      User.find()
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(3),
      Lead.find()
        .sort({ createdAt: -1 })
        .limit(3)
    ]);

    const activities = [
      ...recentProperties.map(p => ({
        type: 'property',
        description: `New property "${p.title}" added`,
        createdAt: p.createdAt,
        user: p.owner || null
      })),
      ...recentUsers.map(u => ({
        type: 'user',
        description: `New ${u.role} registration: ${u.name}`,
        createdAt: u.createdAt,
        user: { name: u.name, email: u.email }
      })),
      ...recentLeads.map(l => ({
        type: 'lead',
        description: `New lead: ${l.name}`,
        createdAt: l.createdAt,
        user: null
      }))
    ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);

    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json([]);
  }
});

// Coupons - list & create
// GET /api/admin/coupons?limit=50
router.get('/coupons', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000);
    const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/admin/coupons - generate a coupon code and save
router.post('/coupons', async (req, res) => {
  try {
    const { title, planName, price, durationMinutes, planDuration, referralFee, paymentLink } = req.body;
    if (!title || !planName || !price || !durationMinutes || !planDuration || !referralFee || !paymentLink) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Generate unique code
    const makeCode = (len = 10) => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      let s = '';
      for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    };

    let code = makeCode(10);
    // ensure uniqueness (small loop)
    for (let i = 0; i < 6; i++) {
      const exists = await Coupon.findOne({ code });
      if (!exists) break;
      code = makeCode(10 + i);
    }

    const c = new Coupon({
      title,
      planName,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      planDuration,
      referralFee: Number(referralFee),
      paymentLink,
      code,
      createdBy: req.user?._id || null
    });

    await c.save();
    res.json({ success: true, coupon: c });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/admin/coupons/:id - remove a coupon
router.delete('/coupons/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const removed = await Coupon.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted', coupon: removed });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============= PROPERTIES MANAGEMENT =============

// Get all properties
router.get('/properties', async (req, res) => {
  try {
    const { status, limit = 50, page = 1, search } = req.query;
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Property.countDocuments(query);
    const properties = await Property.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      properties,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
});

// Create property
router.post('/properties', async (req, res) => {
  try {
    const { title, location, price, status, owner, images, description, type, city, bedrooms, bathrooms, area } = req.body;

    const property = new Property({
      title,
      location,
      price: Number(price),
      status: status || 'pending',
      owner: owner || 'temp-owner-id', // Temporary
      images: images || [],
      description: description || 'No description',
      propertyType: type || 'house',
      city: city || 'Unknown',
      bedrooms: bedrooms || 0,
      bathrooms: bathrooms || 0,
      squareFeet: area ? parseInt(area.replace('sqft', '').trim()) || 0 : 0
    });

    await property.save();

    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email');

    res.status(201).json({
      property: populatedProperty,
      message: 'Property created successfully'
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
});

  // Full property update (admin) - update many fields at once
  router.put('/properties/:id', async (req, res) => {
    try {
      const propId = req.params.id;
      const updates = req.body || {};

      const allowed = ['title','description','price','address','city','state','zipCode','bedrooms','bathrooms','squareFeet','status','images','listingType','propertyType'];
      const toSet = {};
      Object.keys(updates).forEach(k => { if (allowed.includes(k)) toSet[k] = updates[k]; });

      // Coerce numeric fields
      if (toSet.price !== undefined) toSet.price = parseFloat(toSet.price) || 0;
      if (toSet.bedrooms !== undefined) toSet.bedrooms = parseInt(toSet.bedrooms) || 0;
      if (toSet.bathrooms !== undefined) toSet.bathrooms = parseFloat(toSet.bathrooms) || 0;
      if (toSet.squareFeet !== undefined) toSet.squareFeet = parseInt(toSet.squareFeet) || 0;

      const updated = await Property.findByIdAndUpdate(propId, toSet, { new: true, runValidators: true })
        .populate('owner', 'name email phone');

      if (!updated) return res.status(404).json({ success: false, message: 'Property not found' });

      res.json({ success: true, message: 'Property updated', property: updated });
    } catch (error) {
      console.error('Error in admin full property update:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

// Update property status
router.put('/properties/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`Updating property ${id} status to: ${status}`);

    if (!['pending', 'published', 'sold', 'rented', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status' 
      });
    }

    const updateData = { 
      status: status,
      updatedAt: new Date()
    };

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true 
      }
    ).populate('owner', 'name email');

    if (!updatedProperty) {
      return res.status(404).json({ 
        message: 'Property not found' 
      });
    }

    res.json({
      message: `Property ${status === 'published' ? 'approved' : status === 'rejected' ? 'rejected' : 'status updated'} successfully`,
      property: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
});

// Approve property
router.put('/properties/:id/approve', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found' 
      });
    }
    
    property.status = 'published';
    property.approvedAt = new Date();
    property.updatedAt = new Date();
    
    await property.save();
    
    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email');
    
    res.json({ 
      message: 'Property approved successfully', 
      property: populatedProperty 
    });
  } catch (error) {
    console.error('Error approving property:', error);
    res.status(500).json({ 
      message: 'Error approving property',
      error: error.message 
    });
  }
});

// Reject property
router.put('/properties/:id/reject', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found' 
      });
    }
    
    property.status = 'rejected';
    property.rejectedAt = new Date();
    property.updatedAt = new Date();
    
    await property.save();
    
    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email');
    
    res.json({ 
      message: 'Property rejected successfully', 
      property: populatedProperty 
    });
  } catch (error) {
    console.error('Error rejecting property:', error);
    res.status(500).json({ 
      message: 'Error rejecting property',
      error: error.message 
    });
  }
});

// Delete property
router.delete('/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ 
        message: 'Property not found' 
      });
    }
    
    await property.deleteOne();
    
    res.json({
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ 
      message: error.message 
    });
  }
});

// ============= USERS MANAGEMENT =============

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, page = 1, search = '', role } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { name, email, role, phone, password, company, licenseNumber, commissionRate, address, membership } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Create user object
    const userData = {
      name,
      email,
      role: role || 'user',
      phone: phone || '',
      password: password || 'Default123!',
      isActive: true
    };

    // Add role-specific data
    if (role === 'client') {
      userData.clientInfo = {
        company: company || '',
        clientStatus: 'active'
      };
    }

    if (role === 'agent') {
      // Derive leadsPerMonth from membership plan mapping
      const planMap = { Essential: 1, Accelerate: 2, Priority: 3, Prestige: 4 };
      let leadsPerMonth = 0;
      const planName = membership?.plan || '';
      if (planName && planMap[planName] !== undefined) {
        leadsPerMonth = planMap[planName];
      } else if (!isNaN(parseInt(planName))) {
        leadsPerMonth = parseInt(planName);
      }

      userData.agentInfo = {
        licenseNumber: licenseNumber || '',
        commissionRate: commissionRate ? parseFloat(commissionRate) : 5,
        isVerified: false,
        membership: {
          program: membership?.program || 'Realizty',
          plan: membership?.plan || '',
          leadsPerMonth
        }
      };
    }

    // Include address if provided
    if (address && typeof address === 'object') {
      userData.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || address.stateProvince || '',
        country: address.country || '',
        zipCode: address.zipCode || ''
      };
    }

    // Create and save user
    const user = new User(userData);
    await user.save();

    // Prepare response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    // Add role-specific fields
    if (user.role === 'client' && user.clientInfo) {
      userResponse.company = user.clientInfo.company;
      userResponse.clientStatus = user.clientInfo.clientStatus;
    }

    if (user.role === 'agent' && user.agentInfo) {
      userResponse.licenseNumber = user.agentInfo.licenseNumber;
      userResponse.commissionRate = user.agentInfo.commissionRate;
      userResponse.membership = user.agentInfo.membership || { program: 'Realizty', plan: '', leadsPerMonth: 0 };
    }
    // include address in response if present
    if (user.address) {
      userResponse.address = user.address;
    }

    res.status(201).json({
      user: userResponse,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, isActive, company, licenseNumber, commissionRate, address } = req.body;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: id }
      });

      if (existingUser) {
        return res.status(400).json({
          message: 'Email already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      role,
      phone,
      isActive,
      updatedAt: new Date()
    };

    // Handle role-specific updates
    if (role === 'client') {
      updateData.clientInfo = {
        company: company || '',
        clientStatus: 'active'
      };
      updateData.agentInfo = undefined;
    } else if (role === 'agent') {
      // derive membership leadsPerMonth if provided
      const membership = req.body.membership || {};
      const planMap = { Essential: 1, Accelerate: 2, Priority: 3, Prestige: 4 };
      let leadsPerMonth = 0;
      const planName = membership?.plan || '';
      if (planName && planMap[planName] !== undefined) {
        leadsPerMonth = planMap[planName];
      } else if (!isNaN(parseInt(planName))) {
        leadsPerMonth = parseInt(planName);
      }

      updateData.agentInfo = {
        licenseNumber: licenseNumber || '',
        commissionRate: commissionRate ? parseFloat(commissionRate) : 5,
        isVerified: false,
        membership: {
          program: membership?.program || 'Realizty',
          plan: membership?.plan || '',
          leadsPerMonth
        }
      };
      // allow updating address for agents
      if (address && typeof address === 'object') {
        updateData.address = {
          street: address.street || '',
          city: address.city || '',
          state: address.state || address.stateProvince || '',
          country: address.country || '',
          zipCode: address.zipCode || ''
        };
      }
      updateData.clientInfo = undefined;
    } else {
      updateData.clientInfo = undefined;
      updateData.agentInfo = undefined;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      message: 'User deleted successfully',
      _id: id
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      message: error.message
    });
  }
});

export default router;
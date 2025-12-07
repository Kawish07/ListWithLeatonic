import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Lead from '../models/Lead.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============= MULTER CONFIGURATION =============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user?.id || 'unknown'}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ============= TEST ROUTE =============
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'User routes are working!',
    timestamp: new Date().toISOString()
  });
});

// ============= PROFILE ENDPOINTS =============

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('clientInfo.assignedAgent', 'name email phone avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if calculateProfileCompletion exists before calling it
    const profileCompletion = typeof user.calculateProfileCompletion === 'function' 
      ? user.calculateProfileCompletion() 
      : 0;

    res.json({
      success: true,
      user,
      profileCompletion
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Upload profile image
router.post('/upload-profile-image',
  authMiddleware,
  upload.single('profileImage'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please select an image file to upload'
        });
      }

      // Construct the image URL
      const imageUrl = `/uploads/profile-images/${req.file.filename}`;

      // Get current user to check old image
      const currentUser = await User.findById(req.user.id);

      // Delete old image if exists
      if (currentUser?.avatar) {
        const oldFilename = currentUser.avatar.split('/').pop();
        const oldPath = path.join(__dirname, '../uploads/profile-images', oldFilename);

        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.error('Error deleting old image:', err);
          });
        }
      }

      // Update user's avatar field
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { avatar: imageUrl },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl: imageUrl,
        user: updatedUser
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);

      // If there's a file, delete it
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload profile image'
      });
    }
  });

// Delete profile image
router.delete('/profile-image', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.avatar) {
      return res.json({
        success: true,
        message: 'No profile image to remove'
      });
    }

    // Remove the file from server
    const filename = user.avatar.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/profile-images', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update user record
    user.avatar = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image removed successfully'
    });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove profile image'
    });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, bio, address } = req.body;

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (address !== undefined) updateData.address = address;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Populate referenced fields
    if (updatedUser.clientInfo?.assignedAgent) {
      await updatedUser.populate('clientInfo.assignedAgent', 'name email phone avatar');
    }

    // Calculate profile completion safely
    const profileCompletion = typeof updatedUser.calculateProfileCompletion === 'function' 
      ? updatedUser.calculateProfileCompletion() 
      : 0;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
      profileCompletion
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as old
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
});

// Contact support
router.post('/contact-support', authMiddleware, async (req, res) => {
  try {
    const { subject, message, category = 'general' } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    // Simulate ticket creation
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('Support Request:', {
      userId: req.user.id,
      subject,
      message,
      category,
      ticketId
    });

    res.json({
      success: true,
      message: 'Your message has been sent to our support team. We will respond within 24 hours.',
      ticketId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error submitting support request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit support request'
    });
  }
});

// ============= DASHBOARD ENDPOINTS =============

// User dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Count leads assigned to this user
    const assignedLeadsCount = await Lead.countDocuments({ assignedTo: userId });
    
    // Get recent leads assigned to this user
    const [totalProperties, myProperties, assignedLeads, recentLeads] = await Promise.all([
      // Count properties based on user role
      userRole === 'agent'
        ? Property.countDocuments({ 'agentInfo.assignedAgent': userId })
        : Property.countDocuments({ owner: userId }),

      // Get user's properties
      userRole === 'agent'
        ? Property.find({ 'agentInfo.assignedAgent': userId }).sort({ createdAt: -1 }).limit(5)
        : Property.find({ owner: userId }).sort({ createdAt: -1 }).limit(5),

      // Count leads assigned to user
      Lead.countDocuments({ assignedTo: userId }),

      // Get recent leads assigned to user
      Lead.find({ assignedTo: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedTo', 'name email')
    ]);

    // Count lead statuses
    const allAssignedLeads = await Lead.find({ assignedTo: userId });
    const activeLeads = allAssignedLeads.filter(lead => ['assigned', 'contacted'].includes(lead.status)).length;
    const pendingLeads = allAssignedLeads.filter(lead => lead.status === 'pending').length;

    res.json({
      success: true,
      stats: {
        totalProperties,
        totalLeads: assignedLeadsCount,
        assignedLeads,
        activeLeads,
        pendingLeads
      },
      recentLeads: recentLeads.map(lead => ({
        _id: lead._id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || '',
        category: lead.category || '',
        label: lead.label || '',
        status: lead.status,
        requirements: lead.requirements || '',
        company: lead.company || '',
        city: lead.city || '',
        stateProvince: lead.stateProvince || '',
        internalNote: lead.internalNote || '',
        assignedTo: lead.assignedTo ? {
          _id: lead.assignedTo._id,
          name: lead.assignedTo.name,
          email: lead.assignedTo.email
        } : null,
        createdAt: lead.createdAt
      })),
      myProperties: myProperties.map(property => ({
        _id: property._id,
        title: property.title || 'Untitled Property',
        location: `${property.city || ''}, ${property.state || ''}`.replace(/^,\s*|\s*,/g, '').trim() || 'Location not specified',
        price: property.price || 0,
        images: property.images || [],
        status: property.status || 'pending',
        createdAt: property.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// ============= LEADS MANAGEMENT ENDPOINTS =============

// Get user's assigned leads (with filters and pagination)
router.get('/leads', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, category, label } = req.query;
    const skip = (page - 1) * limit;

    // Query for leads assigned to the current user
    const query = { assignedTo: req.user.id };

    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;
    if (label && label !== 'all') query.label = label;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('assignedTo', 'name email'),
      Lead.countDocuments(query)
    ]);

    res.json({
      success: true,
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user leads:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      error: error.message
    });
  }
});

// Update lead (for assigned agents to update status, notes, etc.)
// Supports PUT and PATCH. Allows partial updates and appending to internal notes.
const ALLOWED_LEAD_FIELDS = ['status', 'label', 'internalNote', 'requirements'];

async function updateAssignedLead(req, res) {
  try {
    const leadId = req.params.id;
    const updates = req.body || {};

    // Find lead first
    const lead = await Lead.findById(leadId).populate('assignedTo', 'name email');
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Check authorization: allow assigned agent or admins
    const userIdStr = String(req.user.id);
    const userRole = req.user.role;
    const assignedIdStr = lead.assignedTo ? String(lead.assignedTo._id) : null;

    if (userRole !== 'admin' && assignedIdStr !== userIdStr) {
      console.warn(`Unauthorized update attempt: user=${userIdStr} role=${userRole} assignedTo=${assignedIdStr} lead=${leadId}`);
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this lead', assignedTo: assignedIdStr, yourId: userIdStr });
    }
    // Apply allowed updates
    let changed = false;
    for (const key of ALLOWED_LEAD_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        // Special handling: if internalNote is provided and the client wants to append,
        // accept an object format { append: true, text: '...' } or a plain string to replace.
        if (key === 'internalNote') {
          const val = updates.internalNote;
          if (val && typeof val === 'object' && val.append && typeof val.text === 'string') {
            // Append with newline
            lead.internalNote = (lead.internalNote ? lead.internalNote + '\n' : '') + val.text;
          } else if (typeof val === 'string') {
            lead.internalNote = val;
          }
        } else {
          lead[key] = updates[key];
        }
        changed = true;
      }
    }

    if (!changed) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    await lead.save();

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'name email');

    res.json({ success: true, message: 'Lead updated successfully', lead: populated });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, message: 'Error updating lead', error: error.message });
  }
}

router.put('/leads/:id', authMiddleware, updateAssignedLead);
router.patch('/leads/:id', authMiddleware, updateAssignedLead);

// Delete lead (only if assigned to current user)
router.delete('/leads/:id', authMiddleware, async (req, res) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findById(leadId).populate('assignedTo', 'name email');
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const userIdStr = String(req.user.id);
    const userRole = req.user.role;
    const assignedIdStr = lead.assignedTo ? String(lead.assignedTo._id) : null;

    if (userRole !== 'admin' && assignedIdStr !== userIdStr) {
      console.warn(`Unauthorized delete attempt: user=${userIdStr} role=${userRole} assignedTo=${assignedIdStr} lead=${leadId}`);
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this lead', assignedTo: assignedIdStr, yourId: userIdStr });
    }

    await Lead.findByIdAndDelete(leadId);

    res.json({ success: true, message: 'Lead deleted successfully', _id: leadId });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, message: 'Error deleting lead', error: error.message });
  }
});

// Get user activity/logs
router.get('/activity', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Simulate activity logs
    const activityLogs = [
      {
        id: 1,
        action: 'Profile Update',
        description: 'Updated personal information',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        icon: 'user'
      },
      {
        id: 2,
        action: 'Login',
        description: `Logged in from ${req.ip || 'unknown'}`,
        timestamp: new Date().toISOString(),
        icon: 'log-in'
      },
      {
        id: 3,
        action: 'Property Added',
        description: 'Added new property listing',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        icon: 'home'
      }
    ];

    res.json({
      success: true,
      logs: activityLogs,
      lastLogin: user?.lastLogin || new Date(),
      accountCreated: user?.createdAt || new Date()
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs'
    });
  }
});

// Get user notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = [
      {
        id: 1,
        title: 'Welcome to Realizty!',
        message: 'Thank you for joining our platform. Complete your profile to get started.',
        type: 'info',
        read: false,
        createdAt: new Date(Date.now() - 172800000) // 2 days ago
      },
      {
        id: 2,
        title: 'New Lead',
        message: 'You have a new lead for your property "Modern Apartment"',
        type: 'success',
        read: true,
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: 3,
        title: 'Profile Complete',
        message: 'Your profile is 80% complete. Add more details to increase visibility.',
        type: 'warning',
        read: false,
        createdAt: new Date()
      }
    ];

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // In production, update in database
    // For now, simulate success
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notificationId
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
});

// Get user properties
router.get('/properties', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { owner: req.user.id };
    if (status && status !== 'all') query.status = status;

    const [properties, total] = await Promise.all([
      Property.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Property.countDocuments(query)
    ]);

    res.json({
      success: true,
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user properties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error.message
    });
  }
});

// Get lead by ID (detailed view for assigned user)
router.get('/leads/:id', authMiddleware, async (req, res) => {
  try {
    const leadId = req.params.id;

    const lead = await Lead.findOne({
      _id: leadId,
      assignedTo: req.user.id
    }).populate('assignedTo', 'name email phone avatar');

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or unauthorized'
      });
    }

    res.json({
      success: true,
      lead
    });
  } catch (error) {
    console.error('Error fetching lead details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead details',
      error: error.message
    });
  }
});

// ============= EXPORT =============
export default router;
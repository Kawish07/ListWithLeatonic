// server/routes/properties.js - UPDATED VERSION
import express from 'express';
import multer from 'multer';
import path from 'path';
import Property from '../models/Property.js';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authMiddleware from '../middleware/auth.js'; // Add this

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/properties');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ============= ROUTES =============

// GET all properties (public)
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 20, 
      page = 1, 
      status = 'published',
      minPrice,
      maxPrice,
      propertyType,
      bedrooms,
      bathrooms
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { status: 'published' }; // Only show published properties publicly

    // Search by free text or specific place fields
    const { search, city, state, country } = req.query;
    if (search) {
      const term = search.trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: { $regex: regex } },
        { address: { $regex: regex } },
        { city: { $regex: regex } },
        { state: { $regex: regex } },
        { country: { $regex: regex } },
        { zipCode: { $regex: regex } }
      ];
    }

    if (city) {
      query.city = { $regex: new RegExp(String(city).trim(), 'i') };
    }

    if (state) {
      query.state = { $regex: new RegExp(String(state).trim(), 'i') };
    }

    if (country) {
      query.country = { $regex: new RegExp(String(country).trim(), 'i') };
    }
    
    // Apply filters
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    
    if (propertyType && propertyType !== 'all') {
      query.propertyType = propertyType;
    }
    
    if (bedrooms) query.bedrooms = { $gte: parseInt(bedrooms) };
    if (bathrooms) query.bathrooms = { $gte: parseInt(bathrooms) };
    
    const properties = await Property.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name email phone')
      .populate('agent', 'name email')
      .sort({ createdAt: -1 });
    
    const total = await Property.countDocuments(query);
    
    res.json({
      success: true,
      properties,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching properties',
      error: error.message 
    });
  }
});

// GET user's properties (protected)
router.get('/user/my-properties', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const properties = await Property.find({ owner: userId })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      properties
    });
  } catch (error) {
    console.error('Error fetching user properties:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user properties',
      error: error.message 
    });
  }
});

// POST create new property (protected)
// server/routes/properties.js - Update POST route
router.post('/', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    console.log('=== Creating new property ===');
    console.log('User:', req.user);
    console.log('Body fields:', req.body);
    console.log('Files:', req.files);
    
    // Parse features if provided
    let features = {};
    if (req.body.features) {
      try {
        features = typeof req.body.features === 'string' 
          ? JSON.parse(req.body.features)
          : req.body.features;
      } catch (e) {
        console.warn('Could not parse features:', e);
        features = {};
      }
    }
    
    // Parse existing images
    const existingImages = req.body.existingImages ? 
      (Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages]) 
      : [];
    
    const propertyData = {
      title: req.body.title || '',
      description: req.body.description || '',
      propertyType: req.body.propertyType || req.body.type || 'house', // Handle both
      listingType: req.body.listingType || 'sale',
      price: parseFloat(req.body.price) || 0,
      address: req.body.address || '',
      city: req.body.city || '',
      state: req.body.state || '',
      zipCode: req.body.zipCode || '',
      bedrooms: parseInt(req.body.bedrooms) || 0,
      bathrooms: parseFloat(req.body.bathrooms) || 0,
      squareFeet: parseInt(req.body.squareFeet) || 
                  parseInt(req.body.area?.replace('sqft', '').trim()) || 0, // Handle area field
      yearBuilt: parseInt(req.body.yearBuilt) || undefined,
      features: features,
      owner: req.user.id,
      status: 'pending',
      images: [
        ...existingImages,
        ...(req.files ? req.files.map(file => `/uploads/properties/${file.filename}`) : [])
      ]
    };
    
    console.log('Property data to save:', propertyData);
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'price', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => {
      const value = propertyData[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    // Create property
    const property = new Property(propertyData);
    await property.save();
    
    // Populate owner info
    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone');
    
    console.log('Property created successfully:', property._id);
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      property: populatedProperty
    });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating property',
      error: error.message,
      stack: error.stack
    });
  }
});

// GET single property
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('agent', 'name email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching property',
      error: error.message
    });
  }
});

// PUT update property (protected)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user owns the property
    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this property'
      });
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    res.json({
      success: true,
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating property',
      error: error.message
    });
  }
});

// DELETE property (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check if user owns the property or is admin
    if (property.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this property'
      });
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting property',
      error: error.message
    });
  }
});

// POST contact property owner
router.post('/:id/contact', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }
    
    const property = await Property.findById(req.params.id).populate('owner', 'email');
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Here you would:
    // 1. Save the lead to database
    // 2. Send email notification to property owner
    // 3. Return success
    
    // For now, just return success
    res.json({
      success: true,
      message: 'Message sent successfully. The property owner will contact you soon.'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

export default router;
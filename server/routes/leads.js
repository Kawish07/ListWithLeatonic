// server/routes/leads.js - CLEANED VERSION
import express from 'express';
import Lead from '../models/Lead.js'; // Import from models folder
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all leads
// Get all leads
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const leads = await Lead.find()
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email');
    
    res.json({
      success: true,
      leads,
      total: await Lead.countDocuments(),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Add lead
// Add lead
// Add lead
router.post('/', async (req, res) => {
  try {
    console.log('Received lead data:', req.body);
    
    const { 
      firstName, lastName, email, phone, requirements, 
      category, label, status, company, country, 
      stateProvince, city, internalNote, source,
      assignedTo  // ADD THIS LINE
    } = req.body;
    
    // Create lead object with all fields INCLUDING assignedTo
    const leadData = {
      firstName,
      lastName,
      email,
      phone: phone || '',
      requirements: requirements || '',
      category: category || '',
      label: label || '',
      status: status || 'pending',
      company: company || '',
      country: country || '',
      stateProvince: stateProvince || '',
      city: city || '',
      internalNote: internalNote || '',
      source: source || 'admin',
      assignedTo: assignedTo || null  // ADD THIS LINE - set to null if not provided
    };
    
    console.log('Creating lead with data:', leadData);
    
    const lead = new Lead(leadData);
    
    await lead.save();
    
    // Return the lead with virtuals and populated assigned agent
    const savedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email address');
    
    res.status(201).json({
      success: true,
      lead: savedLead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    // Return the updated lead object so clients can replace the existing entry safely
    res.json({
      success: true,
      lead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByIdAndDelete(id);
    
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    
    res.json({
      message: 'Lead deleted successfully',
      _id: id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk upload leads
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const leads = [];
    const errors = [];
    let processed = 0;

    // Read CSV file
    const filePath = path.join(process.cwd(), req.file.path);
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          processed++;
          
          // Validate required fields
          if (!row.name || !row.email) {
            errors.push({ 
              row: processed, 
              error: 'Missing required fields (name, email)',
              data: row 
            });
            return;
          }

          // Format data
          const leadData = {
            name: row.name.toString().trim(),
            email: row.email.toString().toLowerCase().trim(),
            phone: row.phone ? row.phone.toString().trim() : '',
            source: row.source ? row.source.toString().trim() : 'website',
            propertyInterest: row.propertyInterest || row.property || '',
            status: row.status ? row.status.toString().trim() : 'new',
            notes: row.notes || row.message || '',
            createdAt: new Date()
          };

          leads.push(leadData);
        })
        .on('end', async () => {
          try {
            let successful = 0;
            
            // Insert all leads to database
            if (leads.length > 0) {
              const result = await Lead.insertMany(leads, { ordered: false });
              successful = result.length;
            }

            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.json({
              message: 'Bulk upload completed',
              summary: {
                totalProcessed: processed,
                successful,
                failed: errors.length,
                errors: errors.slice(0, 10) // Return first 10 errors only
              }
            });
            resolve();
          } catch (dbError) {
            // Clean up file even if error
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            res.status(500).json({ 
              message: 'Database error', 
              error: dbError.message 
            });
            reject(dbError);
          }
        })
        .on('error', (error) => {
          // Clean up file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          res.status(500).json({ 
            message: 'CSV parsing error', 
            error: error.message 
          });
          reject(error);
        });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export leads to CSV
router.get('/export', async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    
    // Convert to CSV format
    const headers = ['Name', 'Email', 'Phone', 'Source', 'Property Interest', 'Status', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.email.replace(/"/g, '""')}"`,
        `"${lead.phone ? lead.phone.replace(/"/g, '""') : ''}"`,
        `"${lead.source.replace(/"/g, '""')}"`,
        `"${lead.propertyInterest ? lead.propertyInterest.replace(/"/g, '""') : ''}"`,
        `"${lead.status.replace(/"/g, '""')}"`,
        `"${new Date(lead.createdAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
    res.send(csvRows);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; // ✅ SINGLE EXPORT AT THE END
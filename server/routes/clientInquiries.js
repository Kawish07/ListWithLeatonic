import express from 'express';
import ClientInquiry from '../models/ClientInquiry.js';
import { sendInquiryNotification, sendClientConfirmation } from '../utils/emailService.js';

const router = express.Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
  console.log('✅ Client inquiries test route hit');
  res.json({
    success: true,
    message: 'Client inquiries router is working!'
  });
});

// Submit new client inquiry
router.post('/', async (req, res) => {
  console.log('📨 POST /api/client-inquiries hit');
  console.log('Request body:', req.body);
  
  try {
    const {
      propertyId,
      propertyTitle,
      propertyPrice,
      propertyType,
      name,
      email,
      phone,
      message,
      purpose,
      lookingFor,
      state,
      preferredDate,
      preferredTime
    } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    // Create inquiry
    const inquiry = new ClientInquiry({
      propertyId: propertyId || null,
      propertyTitle: propertyTitle || 'General Inquiry',
      propertyPrice: propertyPrice || 0,
      propertyType: propertyType || 'N/A',
      name,
      email,
      phone: phone || '',
      message,
      purpose: purpose || 'info',
      lookingFor: lookingFor || 'general',
      state: state || '',
      preferredDate: preferredDate || '',
      preferredTime: preferredTime || '',
      status: 'new'
    });

    console.log('💾 Saving inquiry to database...');
    await inquiry.save();
    console.log('✅ Inquiry saved successfully with ID:', inquiry._id);

    // Send email notifications
    console.log('📧 Attempting to send email notifications...');
    
    try {
      // Send notification to admin
      console.log('📧 Sending admin notification...');
      const adminEmailResult = await sendInquiryNotification({
        name,
        email,
        phone: phone || '',
        message,
          purpose: purpose || 'info',
          lookingFor: lookingFor || 'general',
          state: state || '',
          preferredDate: preferredDate || '',
          preferredTime: preferredTime || '',
          propertyTitle: propertyTitle || 'General Inquiry',
          propertyPrice: propertyPrice || 0,
          propertyType: propertyType || 'N/A'
      });

      if (adminEmailResult.success) {
        console.log('✅ Admin email sent successfully!');
        console.log('   Message ID:', adminEmailResult.messageId);
      } else {
        console.error('❌ Admin email failed:', adminEmailResult.error);
      }

      // Send confirmation to client
      console.log('📧 Sending client confirmation...');
      const clientEmailResult = await sendClientConfirmation({
        name,
        email,
        propertyTitle: propertyTitle || 'General Inquiry',
        purpose: purpose || 'info'
      });

      if (clientEmailResult.success) {
        console.log('✅ Client confirmation email sent successfully!');
        console.log('   Message ID:', clientEmailResult.messageId);
      } else {
        console.error('❌ Client confirmation email failed:', clientEmailResult.error);
      }

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError);
      console.error('Error stack:', emailError.stack);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. We will contact you soon.',
      inquiry: {
        _id: inquiry._id,
        propertyTitle,
        createdAt: inquiry.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error submitting inquiry:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry',
      error: error.message
    });
  }
});

// Get all inquiries (for admin)
router.get('/', async (req, res) => {
  console.log('📋 GET /api/client-inquiries hit');
  
  try {
    const { status, excludeClosed, limit = 50, page = 1, search } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // Allow client to request excluding closed inquiries explicitly
    if (excludeClosed === 'true') {
      query.status = { $ne: 'closed' };
    } else if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { propertyTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const [inquiries, total] = await Promise.all([
      ClientInquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ClientInquiry.countDocuments(query)
    ]);

    res.json({
      success: true,
      inquiries,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('❌ Error fetching inquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries',
      error: error.message
    });
  }
});

// Get inquiry by ID
router.get('/:id', async (req, res) => {
  console.log('📋 GET /api/client-inquiries/:id hit');
  
  try {
    const inquiry = await ClientInquiry.findById(req.params.id)
      .populate('propertyId', 'title price images propertyType');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      inquiry
    });
  } catch (error) {
    console.error('❌ Error fetching inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry',
      error: error.message
    });
  }
});

// Update inquiry status
router.put('/:id/status', async (req, res) => {
  console.log('✏️ PUT /api/client-inquiries/:id/status hit');
  
  try {
    const { status } = req.body;
    
    const inquiry = await ClientInquiry.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      message: 'Inquiry status updated',
      inquiry
    });
  } catch (error) {
    console.error('❌ Error updating inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inquiry',
      error: error.message
    });
  }
});

// Delete inquiry
router.delete('/:id', async (req, res) => {
  console.log('🗑️ DELETE /api/client-inquiries/:id hit');
  
  try {
    const inquiry = await ClientInquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inquiry',
      error: error.message
    });
  }
});

// Get inquiry stats for admin dashboard
router.get('/dashboard/stats', async (req, res) => {
  console.log('📊 GET /api/client-inquiries/dashboard/stats hit');
  
  try {
    const [totalInquiries, newInquiries, todayInquiries, totalByPurpose] = await Promise.all([
      ClientInquiry.countDocuments(),
      ClientInquiry.countDocuments({ status: 'new' }),
      ClientInquiry.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      ClientInquiry.aggregate([
        {
          $group: {
            _id: '$purpose',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalInquiries,
        newInquiries,
        todayInquiries,
        byPurpose: totalByPurpose
      }
    });
  } catch (error) {
    console.error('❌ Error fetching inquiry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry stats',
      error: error.message
    });
  }
});

console.log('✅ Client inquiries router loaded');

export default router;
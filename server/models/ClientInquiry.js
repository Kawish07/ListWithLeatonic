import mongoose from 'mongoose';

const clientInquirySchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    default: null
  },
  propertyTitle: {
    type: String,
    default: 'General Inquiry'
  },
  propertyPrice: {
    type: Number,
    default: 0
  },
  propertyType: {
    type: String,
    default: 'N/A'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['buy', 'rent', 'viewing', 'info'],
    default: 'info'
  },
  lookingFor: {
    type: String,
    enum: ['for_home', 'sell_property', 'pre_approved', 'general'],
    default: 'general'
  },
  state: {
    type: String,
    default: ''
  },
  preferredDate: {
    type: String,
    default: ''
  },
  preferredTime: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'in-progress', 'completed', 'closed'],
    default: 'new'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
clientInquirySchema.index({ email: 1 });
clientInquirySchema.index({ status: 1 });
clientInquirySchema.index({ createdAt: -1 });
clientInquirySchema.index({ propertyId: 1 });

const ClientInquiry = mongoose.model('ClientInquiry', clientInquirySchema);

export default ClientInquiry;
// server/models/Lead.js
import mongoose from 'mongoose';

// Canonical lead statuses used across the app
export const LEAD_STATUSES = ['pending', 'contacted', 'in_process', 'closed', 'rejected', 'non-viable'];

const leadSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    default: ''
  },
  requirements: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: {
      values: ['buyer', 'seller', 'rental', ''],
      message: '{VALUE} is not a valid category'
    },
    default: ''
  },
  label: {
    type: String,
    enum: {
      values: ['fresh', 'recycle', 'duplicate', ''],
      message: '{VALUE} is not a valid label'
    },
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: LEAD_STATUSES,
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  company: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    enum: {
      values: ['United States', 'Canada', ''],
      message: '{VALUE} is not a valid country'
    },
    default: ''
  },
  stateProvince: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  internalNote: {
    type: String,
    default: ''
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  source: {
    type: String,
    enum: {
      values: ['website', 'phone', 'email', 'social', 'referral', 'admin', 'walk-in', 'other'],
      message: '{VALUE} is not a valid source'
    },
    default: 'admin'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt automatically
});

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (for backward compatibility)
leadSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Create index for better query performance
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ createdAt: -1 });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
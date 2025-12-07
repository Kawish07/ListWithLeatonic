// server/models/Client.js - UPDATED FOR AUTH
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  company: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['lead', 'active', 'inactive', 'blacklisted'],
    default: 'lead'
  },
  role: {
    type: String,
    enum: ['client', 'premium_client', 'vip_client'],
    default: 'client'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  preferences: {
    propertyTypes: [String],
    locations: [String],
    bedrooms: {
      min: Number,
      max: Number
    },
    budget: {
      min: Number,
      max: Number
    }
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Password hashing middleware
clientSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
clientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
clientSchema.index({ email: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ assignedAgent: 1 });
clientSchema.index({ createdAt: -1 });

export default mongoose.model('Client', clientSchema);
import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  specialty: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'land'],
    default: 'residential'
  },
  experience: {
    type: String,
    enum: ['0-2 years', '2-5 years', '5-10 years', '10+ years'],
    default: '0-2 years'
  },
  commissionRate: {
    type: Number,
    min: 1,
    max: 20,
    default: 5
  },
  bio: {
    type: String,
    maxlength: 500
  },
  languages: [{
    type: String
  }],
  certifications: [{
    name: String,
    year: Number,
    issuer: String
  }],
  assignedProperties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  performance: {
    totalSales: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalClients: {
      type: Number,
      default: 0
    }
  },
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for search
agentSchema.index({ licenseNumber: 1 });
agentSchema.index({ specialty: 1 });
agentSchema.index({ 'performance.averageRating': -1 });

export default mongoose.model('Agent', agentSchema);
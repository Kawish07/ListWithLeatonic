import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // === COMMON FIELDS FOR ALL USERS ===
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
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin', 'client'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  lastLogin: {
    type: Date
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  
  // === PROFILE COMPLETENESS FIELDS ===
  profileCompleted: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // === CLIENT-SPECIFIC FIELDS ===
  clientInfo: {
    company: String,
    clientStatus: {
      type: String,
      enum: ['lead', 'active', 'inactive', 'blacklisted'],
      default: 'active'
    },
    budget: {
      min: Number,
      max: Number
    },
    preferredLocations: [String],
    propertyType: String,
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
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // === AGENT-SPECIFIC FIELDS ===
  agentInfo: {
    licenseNumber: String,
    specialty: String,
    experience: {
      type: Number,
      default: 0
    },
    rating: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 5
    },
    totalListings: { 
      type: Number, 
      default: 0 
    },
    commissionRate: Number,
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    agency: String,
    languages: [String]
    ,
    // Membership for agents (program, plan and derived leads per month)
    membership: {
      program: {
        type: String,
        default: 'Realizty'
      },
      plan: {
        type: String,
        enum: ['Essential', 'Accelerate', 'Priority', 'Prestige', ''],
        default: ''
      },
      leadsPerMonth: {
        type: Number,
        default: 0
      }
    }
  },

  // === ADMIN-SPECIFIC FIELDS ===
  adminInfo: {
    permissions: [String],
    department: String
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update profile completion before saving
userSchema.pre('save', function(next) {
  this.profileCompleted = this.calculateProfileCompletion();
  next();
});

// Update lastLogin before findOneAndUpdate (for login)
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastLogin: new Date() });
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Calculate profile completion percentage
userSchema.methods.calculateProfileCompletion = function() {
  const requiredFields = [
    this.name,
    this.email,
    this.phone,
    this.avatar,
    this.address?.street,
    this.address?.city
  ];
  
  const filledFields = requiredFields.filter(field => 
    field && (typeof field === 'string' ? field.trim() !== '' : true)
  ).length;
  
  return Math.round((filledFields / requiredFields.length) * 100);
};

// Helper method to get user type-specific data
userSchema.methods.getRoleData = function() {
  const user = this.toObject();
  
  switch (this.role) {
    case 'client':
      return {
        ...user,
        company: user.clientInfo?.company,
        clientStatus: user.clientInfo?.clientStatus,
        budget: user.clientInfo?.budget,
        assignedAgent: user.clientInfo?.assignedAgent
      };
    case 'agent':
      return {
        ...user,
        licenseNumber: user.agentInfo?.licenseNumber,
        specialty: user.agentInfo?.specialty,
        experience: user.agentInfo?.experience,
        commissionRate: user.agentInfo?.commissionRate
      };
    default:
      return user;
  }
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  
  const parts = [addr.street, addr.city, addr.state, addr.country, addr.zipCode];
  return parts.filter(part => part && part.trim() !== '').join(', ');
});

const User = mongoose.model('User', userSchema);
export default User;
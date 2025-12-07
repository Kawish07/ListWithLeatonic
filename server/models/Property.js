// server/models/Property.js - UPDATED to match frontend
import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  propertyType: { // Changed from 'type' to 'propertyType'
    type: String,
    enum: ['house', 'apartment', 'condo', 'townhouse', 'villa', 'commercial', 'land'],
    required: true
  },
  listingType: {
    type: String,
    enum: ['sale', 'rent'],
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  bedrooms: {
    type: Number,
    default: 0
  },
  bathrooms: {
    type: Number,
    default: 0
  },
  squareFeet: { // Changed from 'area' to 'squareFeet'
    type: Number,
    default: 0
  },
  yearBuilt: {
    type: Number
  },
  features: { // Changed from array of strings to object
    hasParking: { type: Boolean, default: false },
    hasGarden: { type: Boolean, default: false },
    hasPool: { type: Boolean, default: false },
    hasSecurity: { type: Boolean, default: false },
    hasAC: { type: Boolean, default: false },
    hasHeating: { type: Boolean, default: false },
    hasLaundry: { type: Boolean, default: false },
    hasGym: { type: Boolean, default: false }
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'published', 'sold', 'rented', 'rejected'],
    default: 'pending'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
propertySchema.index({ status: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ city: 1, state: 1 });
propertySchema.index({ createdAt: -1 });

export default mongoose.model('Property', propertySchema);
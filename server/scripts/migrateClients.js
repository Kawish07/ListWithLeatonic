// server/scripts/migrateClients.js - ONE TIME SCRIPT
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Client from '../models/Client.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/listwithlitanic';

const migrateClients = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all clients
    const clients = await Client.find();
    console.log(`📊 Found ${clients.length} clients to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const client of clients) {
      // Check if user already exists with this email
      const existingUser = await User.findOne({ email: client.email });
      
      if (existingUser) {
        console.log(`⏭️  Skipping ${client.email} - already exists as ${existingUser.role}`);
        skipped++;
        continue;
      }

      // Create new user from client data
      const newUser = new User({
        name: client.name,
        email: client.email,
        password: client.password,
        role: 'client',
        phone: client.phone,
        isActive: client.isActive,
        clientInfo: {
          company: client.company,
          clientStatus: client.status,
          budget: client.budget,
          preferredLocations: client.preferences?.locations || [],
          propertyType: client.preferences?.propertyTypes?.[0],
          assignedAgent: client.assignedAgent,
          notes: client.notes
        },
        lastLogin: client.lastLogin
      });

      await newUser.save();
      migrated++;
      console.log(`✅ Migrated: ${client.name} (${client.email})`);
    }

    console.log('\n📋 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log(`📊 Total clients in old collection: ${clients.length}`);

    // Optional: Delete old clients after verification
    // await Client.deleteMany({});
    // console.log('🧹 Old client collection cleared');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run migration
migrateClients();
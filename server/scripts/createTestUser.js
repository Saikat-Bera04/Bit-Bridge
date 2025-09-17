require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/algorand-remit', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create test user
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123', // This will be hashed by the pre-save hook
      firstName: 'Test',
      lastName: 'User',
      walletAddress: 'A2CXX2JJVKK2RREHHAQTWFGM5M5Q3T4KKFSBFF44FGY3Q5I5U6UOALF7M4', // Sample Algorand address
      kycStatus: 'verified',
      preferredCurrency: 'USDC',
      country: 'US',
      phoneNumber: '+1234567890',
      isActive: true
    });

    // Save the user (password will be hashed by the pre-save hook)
    await testUser.save();
    console.log('Test user created successfully:', {
      email: testUser.email,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      walletAddress: testUser.walletAddress
    });

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createTestUser();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'not_started'],
    default: 'not_started'
  },
  kycDocuments: [{
    type: {
      type: String,
      enum: ['passport', 'drivers_license', 'national_id', 'utility_bill']
    },
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferredCurrency: {
    type: String,
    enum: ['ALGO', 'USDC', 'EURC', 'BRZ'],
    default: 'USDC'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get user's display name
userSchema.methods.getDisplayName = function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.walletAddress.substring(0, 8) + '...';
};

// Method to check if user has completed KYC
userSchema.methods.isKycCompleted = function() {
  return this.kycStatus === 'verified';
};

module.exports = mongoose.model('User', userSchema);

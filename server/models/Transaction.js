const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction identifiers
  txId: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number
  },
  
  // User information
  senderAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  recipientAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Transaction details
  assetId: {
    type: Number,
    required: true
  },
  assetSymbol: {
    type: String,
    required: true,
    enum: ['ALGO', 'USDC', 'EURC', 'BRZ']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  amountInBaseUnits: {
    type: String, // Store as string to handle large numbers
    required: true
  },
  
  // Exchange rate information (if conversion was involved)
  exchangeRate: {
    fromCurrency: String,
    toCurrency: String,
    rate: Number,
    rateTimestamp: Date
  },
  
  // Transaction status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'pending'
  },
  confirmations: {
    type: Number,
    default: 0
  },
  
  // Fees
  fee: {
    type: Number,
    default: 0
  },
  
  // Additional metadata
  note: {
    type: String,
    maxlength: 1000
  },
  purpose: {
    type: String,
    enum: ['remittance', 'payment', 'transfer', 'other'],
    default: 'remittance'
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: {
    type: Date
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

// Indexes for better query performance
transactionSchema.index({ senderAddress: 1, createdAt: -1 });
transactionSchema.index({ recipientAddress: 1, createdAt: -1 });
transactionSchema.index({ txId: 1 });
transactionSchema.index({ status: 1 });

// Update the updatedAt field before saving
transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to format amount for display
transactionSchema.methods.getFormattedAmount = function() {
  return `${this.amount} ${this.assetSymbol}`;
};

// Method to check if transaction is completed
transactionSchema.methods.isCompleted = function() {
  return this.status === 'confirmed';
};

// Static method to get user's transaction history
transactionSchema.statics.getUserTransactions = function(walletAddress, limit = 50, offset = 0) {
  return this.find({
    $or: [
      { senderAddress: walletAddress.toLowerCase() },
      { recipientAddress: walletAddress.toLowerCase() }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset);
};

module.exports = mongoose.model('Transaction', transactionSchema);

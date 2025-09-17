const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { Algodv2 } = require('algosdk');

const router = express.Router();

// Initialize Algorand client
const algodToken = ''; // No token needed for public nodes
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodClient = new Algodv2(algodToken, algodServer, algodPort);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile information
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get account information from Algorand
    let accountInfo;
    try {
      accountInfo = await algodClient.accountInformation(user.walletAddress).do();
    } catch (error) {
      console.error('Error fetching Algorand account info:', error);
      accountInfo = { amount: 0, assets: [] };
    }

    // Process balances
    const balances = {
      ALGO: accountInfo.amount / 1000000, // Convert microAlgos to Algos
      assets: {}
    };

    // Process other assets
    if (accountInfo.assets && accountInfo.assets.length > 0) {
      for (const asset of accountInfo.assets) {
        if (asset.amount > 0) {
          const assetInfo = await algodClient.getAssetByID(asset['asset-id']).do();
          const assetSymbol = assetInfo.params['unit-name'] || `ASA-${asset['asset-id']}`;
          balances.assets[assetSymbol] = asset.amount;
        }
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phoneNumber: user.phoneNumber,
        kycStatus: user.kycStatus,
        preferredCurrency: user.preferredCurrency,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt
      },
      balances
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { email, firstName, lastName, country, phoneNumber, preferredCurrency } = req.body;
    
    const updateData = {};
    if (email) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (country) updateData.country = country;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (preferredCurrency) updateData.preferredCurrency = preferredCurrency;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get transaction count from Transaction model
    const Transaction = require('../models/Transaction');
    const transactionCount = await Transaction.countDocuments({
      $or: [
        { senderAddress: user.walletAddress },
        { recipientAddress: user.walletAddress }
      ]
    });

    res.json({
      success: true,
      stats: {
        totalTransactions: transactionCount,
        kycStatus: user.kycStatus,
        memberSince: user.createdAt,
        lastLogin: user.lastLoginAt,
        preferredCurrency: user.preferredCurrency
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;

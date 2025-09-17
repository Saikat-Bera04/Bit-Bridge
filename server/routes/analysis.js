const express = require('express');
const router = express.Router();

// Mock data for development
const mockPortfolio = {
  assets: {
    ALGO: {
      amount: 1000.5,
      usdValue: 250.25,
      percentage: 60.5
    },
    USDC: {
      amount: 500,
      usdValue: 500,
      percentage: 30.2
    },
    YLDY: {
      amount: 10000,
      usdValue: 150.75,
      percentage: 9.3
    }
  },
  totalValue: 901.0,
  lastUpdated: new Date().toISOString()
};

const mockTransactionStats = {
  byDay: {
    '2023-06-01': { amount: 100, count: 2 },
    '2023-06-02': { amount: 250, count: 3 },
    '2023-06-03': { amount: 180, count: 2 },
    '2023-06-04': { amount: 320, count: 4 },
    '2023-06-05': { amount: 150, count: 2 },
  },
  byType: {
    'send': { amount: 300, count: 5 },
    'receive': { amount: 700, count: 8 },
    'swap': { amount: 450, count: 3 }
  },
  totalSent: 300,
  totalReceived: 700,
  totalTransactions: 16,
  period: '30d',
  startDate: '2023-06-01',
  endDate: '2023-06-30'
};

/**
 * @route   GET /api/analysis/portfolio
 * @desc    Get user's portfolio distribution
 * @access  Public (for now)
 */
router.get('/portfolio', (req, res) => {
  try {
    res.json(mockPortfolio);
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({ message: 'Error fetching portfolio data', error: error.message });
  }
});

/**
 * @route   GET /api/analysis/transactions
 * @desc    Get transaction statistics
 * @access  Public (for now)
 */
router.get('/transactions', (req, res) => {
  try {
    res.json(mockTransactionStats);
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({ message: 'Error fetching transaction stats', error: error.message });
  }
});

module.exports = router;

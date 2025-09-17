const express = require('express');
const Transaction = require('../models/Transaction');
const { authenticateToken } = require('../middleware/auth');
const { sendTransaction, getTransactionStatus } = require('../services/algorand');

const router = express.Router();

// Send a new transaction
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const {
      recipientAddress,
      assetId,
      assetSymbol,
      amount,
      note,
      signedTxn
    } = req.body;

    // Validate required fields
    if (!recipientAddress || !assetId || !assetSymbol || !amount || !signedTxn) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipientAddress, assetId, assetSymbol, amount, signedTxn' 
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Submit transaction to Algorand network
    const txResult = await sendTransaction(signedTxn);
    
    if (!txResult.success) {
      return res.status(400).json({ 
        error: 'Transaction failed to submit', 
        details: txResult.error 
      });
    }

    // Calculate amount in base units (microAlgos or microUnits for ASAs)
    const decimals = assetSymbol === 'ALGO' ? 6 : 6; // Most stablecoins use 6 decimals
    const amountInBaseUnits = Math.floor(amount * Math.pow(10, decimals)).toString();

    // Create transaction record
    const transaction = new Transaction({
      txId: txResult.txId,
      senderAddress: req.user.walletAddress,
      recipientAddress: recipientAddress.toLowerCase(),
      assetId: parseInt(assetId),
      assetSymbol,
      amount,
      amountInBaseUnits,
      note: note || '',
      status: 'pending',
      initiatedAt: new Date()
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction submitted successfully',
      transaction: {
        id: transaction._id,
        txId: transaction.txId,
        status: transaction.status,
        amount: transaction.getFormattedAmount(),
        recipientAddress: transaction.recipientAddress,
        initiatedAt: transaction.initiatedAt
      }
    });

  } catch (error) {
    console.error('Send transaction error:', error);
    res.status(500).json({ error: 'Failed to send transaction' });
  }
});

// Get transaction history for current user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = {
      $or: [
        { senderAddress: req.user.walletAddress },
        { recipientAddress: req.user.walletAddress }
      ]
    };

    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Transaction.countDocuments(query);

    const formattedTransactions = transactions.map(tx => ({
      id: tx._id,
      txId: tx.txId,
      type: tx.senderAddress === req.user.walletAddress ? 'sent' : 'received',
      senderAddress: tx.senderAddress,
      recipientAddress: tx.recipientAddress,
      amount: tx.amount,
      assetSymbol: tx.assetSymbol,
      formattedAmount: tx.getFormattedAmount(),
      status: tx.status,
      confirmations: tx.confirmations,
      fee: tx.fee,
      note: tx.note,
      initiatedAt: tx.initiatedAt,
      confirmedAt: tx.confirmedAt,
      isCompleted: tx.isCompleted()
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Get specific transaction details
router.get('/:txId', authenticateToken, async (req, res) => {
  try {
    const { txId } = req.params;
    
    const transaction = await Transaction.findOne({
      txId,
      $or: [
        { senderAddress: req.user.walletAddress },
        { recipientAddress: req.user.walletAddress }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get latest status from blockchain
    const blockchainStatus = await getTransactionStatus(txId);
    
    // Update transaction status if it has changed
    if (blockchainStatus.success && blockchainStatus.status !== transaction.status) {
      transaction.status = blockchainStatus.status;
      transaction.confirmations = blockchainStatus.confirmations || 0;
      transaction.blockNumber = blockchainStatus.blockNumber;
      
      if (blockchainStatus.status === 'confirmed' && !transaction.confirmedAt) {
        transaction.confirmedAt = new Date();
      }
      
      await transaction.save();
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        txId: transaction.txId,
        type: transaction.senderAddress === req.user.walletAddress ? 'sent' : 'received',
        senderAddress: transaction.senderAddress,
        recipientAddress: transaction.recipientAddress,
        amount: transaction.amount,
        assetSymbol: transaction.assetSymbol,
        formattedAmount: transaction.getFormattedAmount(),
        status: transaction.status,
        confirmations: transaction.confirmations,
        blockNumber: transaction.blockNumber,
        fee: transaction.fee,
        note: transaction.note,
        initiatedAt: transaction.initiatedAt,
        confirmedAt: transaction.confirmedAt,
        isCompleted: transaction.isCompleted()
      }
    });

  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// Update transaction status (for webhook or manual refresh)
router.put('/:txId/status', authenticateToken, async (req, res) => {
  try {
    const { txId } = req.params;
    
    const transaction = await Transaction.findOne({
      txId,
      $or: [
        { senderAddress: req.user.walletAddress },
        { recipientAddress: req.user.walletAddress }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get latest status from blockchain
    const blockchainStatus = await getTransactionStatus(txId);
    
    if (!blockchainStatus.success) {
      return res.status(400).json({ 
        error: 'Failed to fetch transaction status from blockchain' 
      });
    }

    // Update transaction
    transaction.status = blockchainStatus.status;
    transaction.confirmations = blockchainStatus.confirmations || 0;
    transaction.blockNumber = blockchainStatus.blockNumber;
    
    if (blockchainStatus.status === 'confirmed' && !transaction.confirmedAt) {
      transaction.confirmedAt = new Date();
    }
    
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction status updated',
      transaction: {
        id: transaction._id,
        txId: transaction.txId,
        status: transaction.status,
        confirmations: transaction.confirmations,
        blockNumber: transaction.blockNumber,
        confirmedAt: transaction.confirmedAt,
        isCompleted: transaction.isCompleted()
      }
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({ error: 'Failed to update transaction status' });
  }
});

module.exports = router;

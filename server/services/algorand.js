const algosdk = require('algosdk');

// Algorand configuration
const algodToken = process.env.ALGOD_TOKEN || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const algodPort = process.env.ALGOD_PORT || '';

// Initialize the algod client
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Asset configurations
const ASSETS = {
  ALGO: { id: 0, decimals: 6 },
  USDC: { id: parseInt(process.env.USDC_ASSET_ID) || 10458941, decimals: 6 },
  EURC: { id: parseInt(process.env.EURC_ASSET_ID) || 227855942, decimals: 6 },
  BRZ: { id: parseInt(process.env.BRZ_ASSET_ID) || 227855943, decimals: 6 },
  INR: { id: parseInt(process.env.INR_ASSET_ID) || 227855944, decimals: 6 }
};

/**
 * Submit a signed transaction to the Algorand network
 */
async function sendTransaction(signedTxnBlob) {
  try {
    console.log('Sending transaction to Algorand TestNet...');
    const { txId } = await algodClient.sendRawTransaction(signedTxnBlob).do();
    console.log('Transaction sent successfully:', txId);
    return {
      success: true,
      txId: txId
    };
  } catch (error) {
    console.error('Send transaction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get transaction status from the blockchain
 */
async function getTransactionStatus(txId) {
  try {
    console.log('Getting transaction status for:', txId);
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round']) {
      return {
        success: true,
        status: 'confirmed',
        confirmations: 1,
        blockNumber: pendingInfo['confirmed-round']
      };
    } else {
      return {
        success: true,
        status: 'pending',
        confirmations: 0
      };
    }
  } catch (error) {
    console.error('Get transaction status error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create an unsigned transaction for ASA transfer
 */
async function createAssetTransferTransaction(senderAddress, recipientAddress, assetId, amount, note = '') {
  try {
    console.log('Creating asset transfer transaction:', { senderAddress, recipientAddress, assetId, amount, note });
    
    const params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      senderAddress,
      recipientAddress,
      undefined, // closeRemainderTo
      undefined, // revocationTarget
      amount,
      note ? new Uint8Array(Buffer.from(note)) : undefined,
      assetId,
      params
    );
    
    return {
      success: true,
      transaction: txn
    };
  } catch (error) {
    console.error('Create asset transfer transaction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create an unsigned transaction for ALGO transfer
 */
async function createAlgoTransferTransaction(senderAddress, recipientAddress, amount, note = '') {
  try {
    console.log('Creating ALGO transfer transaction:', { senderAddress, recipientAddress, amount, note });
    
    const params = await algodClient.getTransactionParams().do();
    const txn = algosdk.makePaymentTxnWithSuggestedParams(
      senderAddress,
      recipientAddress,
      amount,
      undefined, // closeRemainderTo
      note ? new Uint8Array(Buffer.from(note)) : undefined,
      params
    );
    
    return {
      success: true,
      transaction: txn
    };
  } catch (error) {
    console.error('Create ALGO transfer transaction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get account balance for specific asset
 */
async function getAccountBalance(address, assetId = 0) {
  try {
    console.log('Getting account balance for:', { address, assetId });
    
    const accountInfo = await algodClient.accountInformation(address).do();
    
    if (assetId === 0) {
      // ALGO balance (in microAlgos)
      return {
        success: true,
        balance: accountInfo.amount / 1000000 // Convert microAlgos to Algos
      };
    } else {
      // ASA balance
      const asset = accountInfo.assets.find(a => a['asset-id'] === assetId);
      if (asset) {
        return {
          success: true,
          balance: asset.amount / Math.pow(10, ASSETS[Object.keys(ASSETS).find(key => ASSETS[key].id === assetId)]?.decimals || 6)
        };
      } else {
        return {
          success: true,
          balance: 0 // Asset not opted in
        };
      }
    }
  } catch (error) {
    console.error('Get account balance error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Wait for transaction confirmation
 */
async function waitForConfirmation(txId, maxRounds = 10) {
  try {
    console.log('Waiting for confirmation:', { txId, maxRounds });
    
    const status = await algosdk.waitForConfirmation(algodClient, txId, maxRounds);
    
    return {
      success: true,
      confirmedRound: status['confirmed-round'],
      txId: txId
    };
  } catch (error) {
    console.error('Wait for confirmation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  algodClient,
  ASSETS,
  sendTransaction,
  getTransactionStatus,
  createAssetTransferTransaction,
  createAlgoTransferTransaction,
  getAccountBalance,
  waitForConfirmation
};

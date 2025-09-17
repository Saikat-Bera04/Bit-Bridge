const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Algorand TestNet configuration
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = '';

// Initialize algod client
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Generate a temporary address for transaction preparation
const tempAccount = algosdk.generateAccount();
const DEPLOYER_ADDRESS = tempAccount.addr;

// Simple remittance contract
const remittanceContract = `
#pragma version 8
// Simple Remittance Contract

txn ApplicationID
int 0
==
bnz main_create

// Handle NoOp calls
txn OnCompletion
int NoOp
==
bnz handle_noop

// Reject other operations
int 0
return

main_create:
    // Contract creation - always approve
    int 1
    return

handle_noop:
    // Handle application calls
    txna ApplicationArgs 0
    
    // Check for "transfer" command
    byte "transfer"
    ==
    bnz execute_transfer
    
    // Check for "setup" command
    byte "setup"
    ==
    bnz setup_contract
    
    // Default: approve all calls
    int 1
    return

setup_contract:
    // Initialize contract
    byte "initialized"
    int 1
    app_global_put
    int 1
    return

execute_transfer:
    // Log transfer
    byte "transfer_executed"
    log
    int 1
    return
`;

async function deployWithUserWallet() {
    try {
        console.log('🚀 Preparing smart contract for deployment...');
        
        // Get suggested parameters
        const params = await algodClient.getTransactionParams().do();
        console.log('✅ Retrieved network parameters');
        
        // Compile the contract
        const compiledContract = await algodClient.compile(Buffer.from(remittanceContract)).do();
        console.log('✅ Contract compiled successfully');
        console.log('📋 Contract hash:', compiledContract.hash);
        
        // Create unsigned transaction
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: DEPLOYER_ADDRESS,
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: new Uint8Array(Buffer.from(compiledContract.result, 'base64')),
            clearProgram: new Uint8Array(Buffer.from('I3ByYWdtYSB2ZXJzaW9uIDgKaW50IDEK', 'base64')),
            numLocalInts: 0,
            numLocalByteSlices: 0,
            numGlobalInts: 2,
            numGlobalByteSlices: 2,
        });
        
        // Save transaction for signing
        const txnForSigning = {
            txn: appCreateTxn,
            compiledContract: compiledContract,
            network: 'TestNet',
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'deployment-txn.json'),
            JSON.stringify(txnForSigning, null, 2)
        );
        
        console.log('💾 Deployment transaction saved to deployment-txn.json');
        console.log('\n🎯 Next steps:');
        console.log('1. Update DEPLOYER_ADDRESS in this file with your Pera Wallet address');
        console.log('2. Use Pera Wallet to sign and submit the transaction');
        console.log('3. The contract will be deployed to Algorand TestNet');
        
        return txnForSigning;
        
    } catch (error) {
        console.error('❌ Preparation failed:', error);
        throw error;
    }
}

// Create a simple deployment info template
function createDeploymentTemplate() {
    const template = {
        appId: null,
        txId: null,
        deployerAddress: DEPLOYER_ADDRESS,
        network: 'TestNet',
        timestamp: new Date().toISOString(),
        explorerUrl: null,
        status: 'prepared',
        instructions: [
            '1. Connect your Pera Wallet to the dApp',
            '2. Use the wallet to sign the deployment transaction',
            '3. Wait for confirmation on TestNet',
            '4. Update this file with the actual App ID and transaction ID'
        ]
    };
    
    fs.writeFileSync(
        path.join(__dirname, 'deployment-info.json'),
        JSON.stringify(template, null, 2)
    );
    
    console.log('📋 Deployment template created in deployment-info.json');
}

// Run preparation
if (require.main === module) {
    deployWithUserWallet()
        .then(() => {
            createDeploymentTemplate();
            console.log('\n✅ Smart contract ready for deployment!');
            console.log('🔗 Use your Pera Wallet connected to the dApp to deploy');
        })
        .catch((error) => {
            console.error('Preparation failed:', error.message);
            process.exit(1);
        });
}

module.exports = { deployWithUserWallet };

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Algorand TestNet configuration
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = '';

// Initialize algod client
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Smart contract for remittance (simplified version)
const remittanceContract = `
#pragma version 8
// Remittance Smart Contract for Token Transfers

// Global State Schema: 4 keys
// Local State Schema: 0 keys

// Application arguments:
// 0: "setup" - Initialize contract
// 1: "transfer" - Execute transfer
// 2: "get_balance" - Get balance

txn ApplicationID
int 0
==
bnz main_create

// Handle application calls
txn OnCompletion
int NoOp
==
bnz main_noop

// Reject other operations
int 0
return

main_create:
    // Contract creation
    int 1
    return

main_noop:
    // Get first application argument
    txna ApplicationArgs 0
    
    // Check for "setup" command
    byte "setup"
    ==
    bnz setup_contract
    
    // Check for "transfer" command  
    byte "transfer"
    ==
    bnz execute_transfer
    
    // Check for "get_balance" command
    byte "get_balance"
    ==
    bnz get_balance
    
    // Default: reject
    int 0
    return

setup_contract:
    // Initialize contract state
    byte "initialized"
    int 1
    app_global_put
    
    byte "total_transfers"
    int 0
    app_global_put
    
    int 1
    return

execute_transfer:
    // Verify contract is initialized
    byte "initialized"
    app_global_get
    int 1
    ==
    assert
    
    // Increment transfer count
    byte "total_transfers"
    byte "total_transfers"
    app_global_get
    int 1
    +
    app_global_put
    
    // Log transfer (simplified)
    byte "transfer_executed"
    log
    
    int 1
    return

get_balance:
    // Return success for balance queries
    byte "balance_query"
    log
    
    int 1
    return
`;

async function deployContract() {
    try {
        console.log('🚀 Starting smart contract deployment to Algorand TestNet...');
        
        // Get suggested parameters
        const params = await algodClient.getTransactionParams().do();
        console.log('✅ Retrieved network parameters');
        
        // Create a temporary account for deployment (in production, use your actual account)
        const deployerAccount = algosdk.generateAccount();
        const deployerAddress = deployerAccount.addr;
        console.log('📝 Generated deployer account:', deployerAddress);
        console.log('⚠️  IMPORTANT: Fund this account with TestNet ALGOs from: https://testnet.algoexplorer.io/dispenser');
        console.log('🔑 Private key (keep secure):', algosdk.secretKeyToMnemonic(deployerAccount.sk));
        
        // Compile the contract
        const compiledContract = await algodClient.compile(Buffer.from(remittanceContract)).do();
        console.log('✅ Contract compiled successfully');
        
        // Compile clear program
        const clearProgram = '#pragma version 8\nint 1\n';
        const compiledClearProgram = await algodClient.compile(Buffer.from(clearProgram)).do();
        console.log('✅ Clear program compiled successfully');
        
        // Create application transaction
        const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
            from: deployerAddress,
            suggestedParams: params,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
            approvalProgram: new Uint8Array(Buffer.from(compiledContract.result, 'base64')),
            clearProgram: new Uint8Array(Buffer.from(compiledClearProgram.result, 'base64')),
            numLocalInts: 0,
            numLocalByteSlices: 0,
            numGlobalInts: 2,
            numGlobalByteSlices: 2,
        });
        
        // Sign transaction
        const signedTxn = appCreateTxn.signTxn(deployerAccount.sk);
        
        // Submit transaction
        console.log('📤 Submitting deployment transaction...');
        const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
        console.log('✅ Transaction submitted:', txId);
        
        // Wait for confirmation
        console.log('⏳ Waiting for confirmation...');
        const result = await algosdk.waitForConfirmation(algodClient, txId, 4);
        
        const appId = result['application-index'];
        console.log('🎉 Smart contract deployed successfully!');
        console.log('📋 Application ID:', appId);
        console.log('🔗 View on TestNet Explorer:', `https://testnet.algoexplorer.io/application/${appId}`);
        
        // Save deployment info
        const deploymentInfo = {
            appId: appId,
            txId: txId,
            deployerAddress: deployerAddress,
            deployerMnemonic: algosdk.secretKeyToMnemonic(deployerAccount.sk),
            network: 'TestNet',
            timestamp: new Date().toISOString(),
            explorerUrl: `https://testnet.algoexplorer.io/application/${appId}`
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'deployment-info.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('💾 Deployment info saved to deployment-info.json');
        
        return deploymentInfo;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        
        if (error.message.includes('account not found')) {
            console.log('\n💡 Solution: Fund the deployer account with TestNet ALGOs:');
            console.log('   1. Go to https://testnet.algoexplorer.io/dispenser');
            console.log('   2. Enter the deployer address shown above');
            console.log('   3. Request TestNet ALGOs');
            console.log('   4. Wait for the transaction to confirm');
            console.log('   5. Run this script again');
        }
        
        throw error;
    }
}

// Run deployment if called directly
if (require.main === module) {
    deployContract()
        .then((info) => {
            console.log('\n🎯 Next steps:');
            console.log('1. Update your frontend to use App ID:', info.appId);
            console.log('2. Test transactions with your Pera Wallet');
            console.log('3. Monitor transactions on TestNet Explorer');
        })
        .catch((error) => {
            console.error('Deployment failed:', error.message);
            process.exit(1);
        });
}

module.exports = { deployContract };

const algosdk = require('algosdk');
const fs = require('fs');
const path = require('path');

// Algorand TestNet configuration
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = '';

// Initialize algod client
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

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

async function prepareDeployment() {
    try {
        console.log('🚀 Preparing smart contract for deployment...');
        
        // Get suggested parameters
        const params = await algodClient.getTransactionParams().do();
        console.log('✅ Retrieved network parameters');
        
        // Compile the contract
        const compiledContract = await algodClient.compile(Buffer.from(remittanceContract)).do();
        console.log('✅ Contract compiled successfully');
        console.log('📋 Contract hash:', compiledContract.hash);
        
        // Save compiled contract and deployment info
        const deploymentData = {
            compiledContract: {
                result: compiledContract.result,
                hash: compiledContract.hash
            },
            clearProgram: 'I3ByYWdtYSB2ZXJzaW9uIDgKaW50IDEK', // Simple clear program
            params: {
                numLocalInts: 0,
                numLocalByteSlices: 0,
                numGlobalInts: 2,
                numGlobalByteSlices: 2,
            },
            network: 'TestNet',
            timestamp: new Date().toISOString(),
            instructions: [
                '1. Connect your Pera Wallet to the dApp',
                '2. Go to the Send Money page',
                '3. The dApp will use this compiled contract for deployment',
                '4. Sign the deployment transaction with your wallet',
                '5. Wait for confirmation on TestNet'
            ]
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'compiled-contract.json'),
            JSON.stringify(deploymentData, null, 2)
        );
        
        console.log('💾 Compiled contract saved to compiled-contract.json');
        console.log('\n🎯 Smart contract is ready for deployment!');
        console.log('📋 Contract Details:');
        console.log('   - Hash:', compiledContract.hash);
        console.log('   - Size:', Buffer.from(compiledContract.result, 'base64').length, 'bytes');
        console.log('   - Global State: 2 ints, 2 byte slices');
        console.log('   - Local State: 0 ints, 0 byte slices');
        
        console.log('\n✅ Next Steps:');
        console.log('1. Start your frontend application');
        console.log('2. Connect your Pera Wallet');
        console.log('3. Use the dApp to deploy this contract');
        console.log('4. Start sending real tokens!');
        
        return deploymentData;
        
    } catch (error) {
        console.error('❌ Preparation failed:', error);
        throw error;
    }
}

// Run preparation
if (require.main === module) {
    prepareDeployment()
        .then(() => {
            console.log('\n🎉 Smart contract preparation completed successfully!');
        })
        .catch((error) => {
            console.error('Preparation failed:', error.message);
            process.exit(1);
        });
}

module.exports = { prepareDeployment };

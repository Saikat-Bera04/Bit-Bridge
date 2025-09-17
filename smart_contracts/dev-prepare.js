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

async function prepareContract() {
    try {
        console.log('🚀 Preparing smart contract for development...');
        
        // Get suggested parameters
        const params = await algodClient.getTransactionParams().do();
        console.log('✅ Retrieved network parameters');
        
        // Compile the contract
        const compiledContract = await algodClient.compile(Buffer.from(remittanceContract)).do();
        console.log('✅ Contract compiled successfully');
        console.log('📋 Contract hash:', compiledContract.hash);
        
        // Compile clear program
        const clearProgram = '#pragma version 8\nint 1\n';
        const compiledClearProgram = await algodClient.compile(Buffer.from(clearProgram)).do();
        console.log('✅ Clear program compiled successfully');
        
        // Save compiled contract info
        const contractInfo = {
            approvalProgram: compiledContract.result,
            clearProgram: compiledClearProgram.result,
            hash: compiledContract.hash,
            globalInts: 2,
            globalByteSlices: 2,
            localInts: 0,
            localByteSlices: 0,
            network: 'TestNet',
            timestamp: new Date().toISOString(),
            status: 'compiled'
        };
        
        fs.writeFileSync(
            path.join(__dirname, 'compiled-contract.json'),
            JSON.stringify(contractInfo, null, 2)
        );
        
        console.log('💾 Contract info saved to compiled-contract.json');
        console.log('\n🎯 Development setup complete!');
        console.log('📝 Contract is compiled and ready for deployment');
        console.log('🔗 To deploy: Use your Pera Wallet or fund a test account');
        
        return contractInfo;
        
    } catch (error) {
        console.error('❌ Preparation failed:', error);
        throw error;
    }
}

// Run preparation
if (require.main === module) {
    prepareContract()
        .then(() => {
            console.log('\n✅ Smart contract development environment ready!');
            console.log('🛠️  You can now work on the contract without deployment');
        })
        .catch((error) => {
            console.error('Preparation failed:', error.message);
            process.exit(1);
        });
}

module.exports = { prepareContract };

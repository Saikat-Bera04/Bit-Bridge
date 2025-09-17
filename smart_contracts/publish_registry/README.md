# PublishRegistry Smart Contract

A smart contract for managing game publishing on the Algorand blockchain.

## Overview

The PublishRegistry contract allows developers to register games with version information, ownership details, and parent content identifiers. It provides a decentralized registry for game publishing with ownership verification.

## Features

- **Game Registration**: Register games with version, owner, and parent CID
- **Ownership Verification**: Check if an address owns a specific game
- **Version Management**: Track game versions and parent relationships
- **Immutable Records**: All registrations are stored on-chain

## Contract Methods

### `register(gameCid, version, owner, parentCid)`
Registers a new game or updates an existing one.

**Parameters:**
- `gameCid` (bytes): Unique identifier for the game
- `version` (bytes): Version string
- `owner` (bytes): Owner's address as bytes
- `parentCid` (bytes): Parent content identifier

### `getGameInfo(gameCid)`
Retrieves complete game information.

**Parameters:**
- `gameCid` (bytes): Game identifier

**Returns:**
- `[version, owner, parentCid, timestamp]`

### `getParentCid(gameCid)`
Gets the parent CID for a game.

**Parameters:**
- `gameCid` (bytes): Game identifier

**Returns:**
- `parentCid` (bytes): Parent content identifier

### `isOwner(gameCid, address)`
Checks if an address owns a specific game.

**Parameters:**
- `gameCid` (bytes): Game identifier
- `address` (bytes): Address to check

**Returns:**
- `boolean`: True if the address owns the game

## Usage Example

```typescript
import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { PublishRegistryFactory, PublishRegistryUtils } from './index';

// Initialize
const algorand = AlgorandClient.testNet();
const factory = new PublishRegistryFactory(algorand, APP_SPEC);

// Deploy contract
const client = await factory.deploy();

// Register a game
await client.register({
  gameCid: PublishRegistryUtils.createGameCid('MyGame', '1.0.0'),
  version: PublishRegistryUtils.stringToBytes('1.0.0'),
  owner: PublishRegistryUtils.addressToBytes('YOUR_ALGORAND_ADDRESS'),
  parentCid: PublishRegistryUtils.stringToBytes('parent-cid')
});

// Check ownership
const isOwner = await client.isOwner({
  gameCid: PublishRegistryUtils.createGameCid('MyGame', '1.0.0'),
  address: PublishRegistryUtils.addressToBytes('YOUR_ALGORAND_ADDRESS')
});
```

## Files Structure

- `contract.algo.ts` - Main smart contract implementation
- `client.ts` - TypeScript client for contract interaction
- `factory.ts` - Factory for deploying and managing contracts
- `types.ts` - TypeScript type definitions
- `utils.ts` - Utility functions for data conversion
- `index.ts` - Main export file with examples

## Development

1. Compile the contract using AlgoKit
2. Deploy to TestNet or MainNet
3. Use the TypeScript client for interactions

## Security Considerations

- Only the registered owner can update game information
- All data is immutable once recorded
- Ownership verification is cryptographically secure
- No admin privileges or backdoors

## License

MIT License

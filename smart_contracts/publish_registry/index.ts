/**
 * PublishRegistry Smart Contract SDK
 * 
 * This module provides a complete TypeScript interface for interacting with
 * the PublishRegistry smart contract on Algorand blockchain.
 */

export { PublishRegistryClient } from './client';
export { PublishRegistryFactory } from './factory';
export { PublishRegistryUtils } from './utils';
export * from './types';

// Re-export the original generated client for advanced usage
export * from './contract.algo';

/**
 * Example usage:
 * 
 * ```typescript
 * import { AlgorandClient } from '@algorandfoundation/algokit-utils';
 * import { PublishRegistryFactory, PublishRegistryUtils } from './smart_contracts/publish_registry';
 * 
 * // Initialize Algorand client
 * const algorand = AlgorandClient.testNet();
 * 
 * // Create factory
 * const factory = new PublishRegistryFactory(algorand, APP_SPEC);
 * 
 * // Deploy new contract
 * const client = await factory.deploy();
 * 
 * // Register a game
 * await client.register({
 *   gameCid: PublishRegistryUtils.createGameCid('MyGame', '1.0.0'),
 *   version: PublishRegistryUtils.stringToBytes('1.0.0'),
 *   owner: PublishRegistryUtils.addressToBytes('ALGORAND_ADDRESS_HERE'),
 *   parentCid: PublishRegistryUtils.stringToBytes('parent-cid-here')
 * });
 * 
 * // Get game info
 * const gameInfo = await client.getGameInfo({
 *   gameCid: PublishRegistryUtils.createGameCid('MyGame', '1.0.0')
 * });
 * 
 * console.log('Game version:', PublishRegistryUtils.bytesToString(gameInfo.version));
 * console.log('Game owner:', PublishRegistryUtils.bytesToAddress(gameInfo.owner));
 * ```
 */

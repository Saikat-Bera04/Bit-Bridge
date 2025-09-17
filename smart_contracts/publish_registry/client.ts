// Mock algosdk for development
const algosdk = {
  Algodv2: class {
    constructor() {}
  },
  getApplicationAddress: (appId: number) => 'MOCK_APP_ADDRESS_' + appId,
};

import { PublishRegistryArgs, PublishRegistryReturns, GameInfo } from './types';

export class PublishRegistryClient {
  private algodClient: any;
  private applicationId: number;

  constructor(params: {
    appId: number;
    algodClient: any;
  }) {
    this.applicationId = params.appId;
    this.algodClient = params.algodClient;
  }

  /**
   * Register a new game with version, owner, and parent CID
   */
  async register(args: PublishRegistryArgs['register']): Promise<string> {
    // Mock implementation for development
    console.log('Registering game:', args);
    return 'MOCK_TX_ID_' + Date.now();
  }

  /**
   * Get game information by CID
   */
  async getGameInfo(args: PublishRegistryArgs['getGameInfo']): Promise<GameInfo> {
    // Mock implementation for development
    console.log('Getting game info for:', args.gameCid);
    return {
      version: new Uint8Array([1, 0, 0]),
      owner: new Uint8Array([1, 2, 3, 4]),
      parentCid: new Uint8Array([5, 6, 7, 8]),
      timestamp: BigInt(Date.now()),
    };
  }

  /**
   * Get parent CID for a game
   */
  async getParentCid(args: PublishRegistryArgs['getParentCid']): Promise<Uint8Array> {
    // Mock implementation for development
    console.log('Getting parent CID for:', args.gameCid);
    return new Uint8Array([5, 6, 7, 8]);
  }

  /**
   * Check if an address is the owner of a game
   */
  async isOwner(args: PublishRegistryArgs['isOwner']): Promise<boolean> {
    // Mock implementation for development
    console.log('Checking ownership for:', args);
    return true;
  }

  /**
   * Get the application ID
   */
  get appId(): number {
    return this.applicationId;
  }

  /**
   * Get the application address
   */
  get appAddress(): string {
    return algosdk.getApplicationAddress(this.applicationId);
  }
}

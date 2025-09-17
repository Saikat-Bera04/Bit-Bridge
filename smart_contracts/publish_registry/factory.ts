// Mock algosdk for development
const algosdk = {
  Algodv2: class {
    constructor() {}
  },
};
import { PublishRegistryClient } from './client';

export class PublishRegistryFactory {
  private algodClient: any;

  constructor(algodClient: any) {
    this.algodClient = algodClient;
  }

  /**
   * Deploy a new PublishRegistry application
   */
  async deploy(params?: {
    sender?: string;
  }): Promise<PublishRegistryClient> {
    // Mock deployment for development
    const mockAppId = Math.floor(Math.random() * 1000000);
    console.log('Mock deploying PublishRegistry app with ID:', mockAppId);

    return new PublishRegistryClient({
      appId: mockAppId,
      algodClient: this.algodClient,
    });
  }

  /**
   * Get an existing PublishRegistry application client by ID
   */
  async getById(appId: number): Promise<PublishRegistryClient> {
    return new PublishRegistryClient({
      appId,
      algodClient: this.algodClient,
    });
  }

  /**
   * Create a new PublishRegistry application client for an existing app
   */
  static create(params: {
    appId: number;
    algodClient: any;
  }): PublishRegistryClient {
    return new PublishRegistryClient({
      appId: params.appId,
      algodClient: params.algodClient,
    });
  }
}

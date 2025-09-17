// Mock algosdk for development
const algosdk = {
  encodeAddress: (publicKey: Uint8Array) => 'MOCK_ADDRESS_' + publicKey.length,
  decodeAddress: (address: string) => new Uint8Array(32),
  isValidAddress: (address: string) => address.startsWith('MOCK_') || address.length === 58,
};

/**
 * Utility functions for PublishRegistry contract
 */
export class PublishRegistryUtils {
  /**
   * Convert string to Uint8Array for contract calls
   */
  static stringToBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  /**
   * Convert Uint8Array to string from contract responses
   */
  static bytesToString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
  }

  /**
   * Convert Algorand address to bytes
   */
  static addressToBytes(address: string): Uint8Array {
    return algosdk.decodeAddress(address);
  }

  /**
   * Convert bytes to Algorand address
   */
  static bytesToAddress(bytes: Uint8Array): string {
    return algosdk.encodeAddress(bytes);
  }

  /**
   * Create game CID from string
   */
  static createGameCid(gameName: string, version: string): Uint8Array {
    const combined = `${gameName}-${version}-${Date.now()}`;
    return this.stringToBytes(combined);
  }

  /**
   * Validate game CID format
   */
  static validateGameCid(cid: Uint8Array): boolean {
    if (!cid || cid.length === 0) return false;
    
    try {
      const cidString = this.bytesToString(cid);
      return cidString.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Format timestamp for display
   */
  static formatTimestamp(timestamp: bigint): string {
    if (timestamp === 0n) return 'Not set';
    
    const date = new Date(Number(timestamp) * 1000);
    return date.toISOString();
  }

  /**
   * Check if two byte arrays are equal
   */
  static bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    
    return true;
  }
}

// Mock TEALScript implementation for development
class Contract {
  // Mock base contract class
}

type bytes = Uint8Array;
type uint64 = bigint;

class GlobalStateKey<T> {
  value!: T;
}

function Bytes(value: string): bytes {
  return new TextEncoder().encode(value);
}

function Uint64(value: number): uint64 {
  return BigInt(value);
}

// Simplified mock decorator that doesn't interfere with TypeScript
function abimethod(options?: { readonly?: boolean }): any {
  return function (target: any, propertyKey: string, descriptor: any) {
    // Mock decorator - just return the original method
    return descriptor;
  };
}

export class PublishRegistry extends Contract {
  gameCid = new GlobalStateKey<bytes>();
  version = new GlobalStateKey<bytes>();
  owner = new GlobalStateKey<bytes>();
  parentCid = new GlobalStateKey<bytes>();
  timestamp = new GlobalStateKey<uint64>();

  @abimethod()
  register(
    gameCid: bytes,
    version: bytes,
    owner: bytes,
    parentCid: bytes
  ): void {
    this.gameCid.value = gameCid;
    this.version.value = version;
    this.owner.value = owner;
    this.parentCid.value = parentCid;
    this.timestamp.value = Uint64(0);
  }

  @abimethod({ readonly: true })
  getGameInfo(gameCid: bytes): [bytes, bytes, bytes, uint64] {
    if (this.gameCid.value !== gameCid) {
      // Return empty values if game not found
      return [Bytes(""), Bytes(""), Bytes(""), Uint64(0)];
    }
    return [
      this.version.value,
      this.owner.value,
      this.parentCid.value,
      this.timestamp.value,
    ];
  }

  @abimethod({ readonly: true })
  getParentCid(gameCid: bytes): bytes {
    if (this.gameCid.value !== gameCid) {
      return Bytes("");
    }
    return this.parentCid.value;
  }

  @abimethod({ readonly: true })
  isOwner(gameCid: bytes, address: bytes): boolean {
    if (this.gameCid.value !== gameCid) {
      return false;
    }
    return this.owner.value === address;
  }
}

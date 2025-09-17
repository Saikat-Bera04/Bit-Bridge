// Types for PublishRegistry smart contract
export interface PublishRegistryArgs {
  register: {
    gameCid: Uint8Array;
    version: Uint8Array;
    owner: Uint8Array;
    parentCid: Uint8Array;
  };
  getGameInfo: {
    gameCid: Uint8Array;
  };
  getParentCid: {
    gameCid: Uint8Array;
  };
  isOwner: {
    gameCid: Uint8Array;
    address: Uint8Array;
  };
}

export interface PublishRegistryReturns {
  register: void;
  getGameInfo: [Uint8Array, Uint8Array, Uint8Array, bigint];
  getParentCid: Uint8Array;
  isOwner: boolean;
}

export interface GameInfo {
  version: Uint8Array;
  owner: Uint8Array;
  parentCid: Uint8Array;
  timestamp: bigint;
}

export interface PublishRegistryState {
  gameCid: Uint8Array;
  version: Uint8Array;
  owner: Uint8Array;
  parentCid: Uint8Array;
  timestamp: bigint;
}

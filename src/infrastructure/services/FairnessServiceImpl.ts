import crypto from 'crypto';
import {
  FairnessService,
  FairnessCommit,
  FairnessDrawResult
} from '../../domain/services/FairnessService';

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function randomSeedHex(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export class FairnessServiceImpl implements FairnessService {
  generateCommit(graceSeconds: number): FairnessCommit {
    const seed = randomSeedHex(32);
    const seedHash = sha256Hex(seed);
    return { seed, seedHash, graceSeconds };
  }

  computeWinner(seed: string, participantIds: bigint[]): FairnessDrawResult {
    if (!participantIds || participantIds.length === 0) {
      throw new Error('No participants to draw a winner');
    }
    const sorted = [...participantIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const participantsJoined = sorted.map(id => id.toString()).join(',');
    const participantsHash = sha256Hex(participantsJoined);
    const combined = seed + ':' + participantsHash;
    const winnerHash = sha256Hex(combined);
    const first16 = winnerHash.slice(0, 16);
    const number = BigInt('0x' + first16);
    const winnerIndex = Number(number % BigInt(sorted.length));
    const winnerUserId = sorted[winnerIndex];
    const seedHash = sha256Hex(seed);
    return {
      winnerUserId,
      winnerIndex,
      participantsHash,
      combinedHash: combined,
      seed,
      seedHash,
      winnerHash
    };
  }
}

export function createFairnessService(): FairnessService {
  return new FairnessServiceImpl();
}

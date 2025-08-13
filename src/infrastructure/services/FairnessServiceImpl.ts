// FairnessServiceImpl.ts
// Реализация FairnessService (Variant B).
// Алгоритм:
// 1. generateCommit: random seed (32 bytes) -> hex, seedHash = sha256(seed).
// 2. computeWinner:
//    - sort participantIds asc
//    - participantsHash = sha256(sorted.join(','))
//    - combined = seed + ':' + participantsHash
//    - winnerHash = sha256(combined)
//    - take first 16 hex chars => BigInt => mod length => index
//    - winnerUserId = sorted[index]
//    - возврат FairnessDrawResult (включая seed, seedHash, hashes для проверки)

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
    const seed = randomSeedHex(32); // 32 bytes -> 64 hex chars
    const seedHash = sha256Hex(seed);
    return { seed, seedHash, graceSeconds };
  }

  computeWinner(seed: string, participantIds: bigint[]): FairnessDrawResult {
    if (!participantIds || participantIds.length === 0) {
      throw new Error('No participants to draw a winner');
    }

    // 1. Сортируем (чтобы порядок не влиял при проверке)
    const sorted = [...participantIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    // 2. participantsHash
    const participantsJoined = sorted.map(id => id.toString()).join(',');
    const participantsHash = sha256Hex(participantsJoined);

    // 3. combined = seed + ':' + participantsHash
    const combined = seed + ':' + participantsHash;
    const winnerHash = sha256Hex(combined);

    // 4. Извлекаем число
    // Берём первые 16 hex символов (64 бита)
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

// Фабрика (если пригодится для DI)
export function createFairnessService(): FairnessService {
  return new FairnessServiceImpl();
}
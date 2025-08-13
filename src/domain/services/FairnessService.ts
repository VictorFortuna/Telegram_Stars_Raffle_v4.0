// FairnessService.ts (Domain Interfaces)
// Назначение: определить контракт честности без привязки к Node/crypto.

// Данные коммита (когда достигнут threshold и мы фиксируем seedHash)
export interface FairnessCommit {
  seed: string;       // Секретный seed (hex). НЕ сохраняем в БД, пока только hash уходит в raffle.seed_hash
  seedHash: string;   // sha256(seed) — публикуется сразу после commit
  graceSeconds: number;
}

// Результат вычисления победителя (draw)
export interface FairnessDrawResult {
  winnerUserId: bigint;
  winnerIndex: number;
  participantsHash: string; // sha256(sortedIds.join(','))
  combinedHash: string;     // sha256(seed + ':' + participantsHash) — «слой» из которого берём индекс
  seed: string;             // раскрытый seed (для верификации)
  seedHash: string;         // sha256(seed) (должен совпасть с тем, что было в commit)
  winnerHash: string;       // сам winnerHash = sha256(seed + ':' + participantsHash)
}

// Интерфейс сервиса честности
export interface FairnessService {
  generateCommit(graceSeconds: number): FairnessCommit;
  computeWinner(seed: string, participantIds: bigint[]): FairnessDrawResult;
}

// Возможная фабрика (оставим сигнатуру — реализация в infrastructure)
export type FairnessServiceFactory = () => FairnessService;

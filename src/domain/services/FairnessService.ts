// FairnessService (Draft interface)
// Отвечает за генерацию seed, вычисление hash и выбор победителя.
export interface FairnessCommit {
  seed: string;        // hex
  seedHash: string;    // sha256(seed)
  graceSeconds: number;
}

export interface FairnessDrawResult {
  winnerUserId: bigint;
  winnerIndex: number;
  hmac: string;
  participantsHash: string;
}

export interface FairnessService {
  generateCommit(graceSeconds: number): FairnessCommit;
  computeWinner(seed: string, participantIds: bigint[]): Omit<FairnessDrawResult, 'winnerUserId'> & { winnerIndex: number };
  // helper to derive user id after index
}

export const NOT_IMPLEMENTED = () => {
  throw new Error('FairnessService not implemented');
};
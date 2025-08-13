export interface FairnessCommit {
  seed: string;
  seedHash: string;
  graceSeconds: number;
}
export interface FairnessDrawResult {
  winnerUserId: bigint;
  winnerIndex: number;
  participantsHash: string;
  combinedHash: string;
  seed: string;
  seedHash: string;
  winnerHash: string;
}
export interface FairnessService {
  generateCommit(graceSeconds: number): FairnessCommit;
  computeWinner(seed: string, participantIds: bigint[]): FairnessDrawResult;
}
export type FairnessServiceFactory = () => FairnessService;

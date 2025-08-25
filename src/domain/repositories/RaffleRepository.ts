import { Raffle } from '../entities/Raffle';

export interface CreateRaffleParams {
  threshold: number;
  entryCost: number;
  winnerSharePercent: number;
  commissionPercent: number;
  graceSeconds: number;
}

export interface AddEntryResult {
  updatedRaffle: Raffle;
  created: boolean;
  thresholdReached: boolean;
  entrySequence?: number; // Only present if created = true
}

export interface FinalizeDrawParams {
  raffleId: number;
  seed: string;
  seedHash: string;
  winnerUserId: bigint;
  winnerIndex: number;
  participantsHash: string;
  winnerHash: string;
  fairnessVersion: string;
}

export interface RaffleRepository {
  findActiveRaffle(): Promise<Raffle | null>;
  createRaffle(params: CreateRaffleParams): Promise<Raffle>;
  findOrCreateActiveRaffle(params: CreateRaffleParams): Promise<Raffle>;
  userHasEntry(raffleId: number, userId: bigint): Promise<boolean>;
  addEntryTransactional(raffleId: number, userId: bigint): Promise<AddEntryResult>;
  commitSeedIfThreshold(raffleId: number, seedHash: string, graceSeconds: number): Promise<Raffle>;
  listEntries(raffleId: number): Promise<bigint[]>;
  finalizeDraw(params: FinalizeDrawParams): Promise<Raffle>;
}

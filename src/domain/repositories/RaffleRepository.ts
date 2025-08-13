// RaffleRepository.ts (Draft Interface)
// Интерфейс доступа к данным raffle / entries без привязки к конкретной БД.

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
  created: boolean;          // true если новая запись участия
  thresholdReached: boolean; // true если после добавления достигнут threshold
}

export interface RaffleRepository {
  findActiveRaffle(): Promise<Raffle | null>;
  createRaffle(params: CreateRaffleParams): Promise<Raffle>;
  findOrCreateActiveRaffle(params: CreateRaffleParams): Promise<Raffle>;
  userHasEntry(raffleId: number, userId: bigint): Promise<boolean>;
  addEntryTransactional(
    raffleId: number,
    userId: bigint
  ): Promise<AddEntryResult>;
  commitSeedIfThreshold(
    raffleId: number,
    seedHash: string,
    graceSeconds: number
  ): Promise<Raffle>;
  listEntries(raffleId: number): Promise<bigint[]>;
}
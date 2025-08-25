// JoinRaffleUseCase: добавление участника + commit при достижении threshold.
// Интеграция Variant B Fairness (commit только, без draw).
import { RaffleRepository } from '../../domain/repositories/RaffleRepository';
import { FairnessService } from '../../domain/services/FairnessService';
import { WalletProvider } from '../../domain/services/WalletProvider';
import { seedVault } from '../../infrastructure/services/SeedVault';

interface JoinInput {
  userId: bigint;
  username?: string;
  entryCost?: number; // Optional, will use default from raffle
}

interface JoinSuccess {
  status: 'success';
  raffleId: number;
  entrySequence: number;
  totalEntries: number;
  totalFund: number;
  threshold: number;
  thresholdReached: boolean;
  committed: boolean;        // произошло ли (или было уже) закрепление seedHash
  graceSeconds: number;
  entryCost: number;
}

interface JoinError {
  status: 'already_joined' | 'no_active_raffle' | 'insufficient_balance' | 'raffle_full';
  raffleId?: number;
  message?: string;
}

type JoinOutput = JoinSuccess | JoinError;

export interface RaffleDefaults {
  threshold: number;
  entryCost: number;
  winnerSharePercent: number;
  commissionPercent: number;
  graceSeconds: number;
}

export class JoinRaffleUseCase {
  constructor(
    private raffleRepo: RaffleRepository,
    private fairnessService: FairnessService,
    private defaults: RaffleDefaults,
    private walletProvider: WalletProvider
  ) {}

  // Основной метод
  async execute(input: JoinInput): Promise<JoinOutput> {
    // 0. Ensure user exists and check balance
    await this.walletProvider.ensureUser(input.userId);
    const balance = await this.walletProvider.getBalance(input.userId);
    const entryCost = input.entryCost || this.defaults.entryCost;
    
    if (balance < entryCost) {
      return {
        status: 'insufficient_balance',
        message: `Insufficient balance: ${balance}, required: ${entryCost}`
      };
    }

    // 1. Получаем или создаём активный raffle
    const active = await this.raffleRepo.findOrCreateActiveRaffle({
      threshold: this.defaults.threshold,
      entryCost: this.defaults.entryCost,
      winnerSharePercent: this.defaults.winnerSharePercent,
      commissionPercent: this.defaults.commissionPercent,
      graceSeconds: this.defaults.graceSeconds
    });

    const raffleBefore = active.toJSON();

    // Check if raffle is still accepting entries
    if (!['init', 'collecting', 'ready'].includes(raffleBefore.status)) {
      return {
        status: 'no_active_raffle',
        message: `Raffle is in status: ${raffleBefore.status}`
      };
    }

    // 2. Пытаемся добавить участника
    const addResult = await this.raffleRepo.addEntryTransactional(active.id, input.userId);
    const raffleAfter = addResult.updatedRaffle.toJSON();

    const alreadyJoined = !addResult.created;
    const reachedThreshold = addResult.thresholdReached;
    let committed = false;

    // Handle already joined case
    if (alreadyJoined) {
      return {
        status: 'already_joined',
        raffleId: raffleAfter.id
      };
    }

    // 3. Debit the entry cost after successful join
    const debitSuccess = await this.walletProvider.debit(
      input.userId, 
      entryCost, 
      `Entry to raffle #${raffleAfter.id}`
    );
    
    if (!debitSuccess) {
      // This shouldn't happen since we checked balance above, but just in case
      return {
        status: 'insufficient_balance',
        message: 'Failed to debit entry cost - concurrent modification?'
      };
    }

    // 4. Если достигнут threshold и ещё не статус ready -> commit
    if (reachedThreshold && raffleAfter.status !== 'ready') {
      const commit = this.fairnessService.generateCommit(raffleAfter.graceSeconds);
      // Сохраняем seed в память (если не был)
      seedVault.storeIfAbsent(raffleAfter.id, commit.seed);

      // Пытаемся обновить raffle до ready (если кто-то другой успел, вернётся уже обновлённый)
      const committedRaffle = await this.raffleRepo.commitSeedIfThreshold(
        raffleAfter.id,
        commit.seedHash,
        raffleAfter.graceSeconds
      );
      const committedState = committedRaffle.toJSON();
      committed = committedState.status === 'ready';
    } else if (raffleAfter.status === 'ready') {
      committed = true; // уже совершён ранее
    }

    return {
      status: 'success',
      raffleId: raffleAfter.id,
      entrySequence: addResult.entrySequence || 0,
      totalEntries: raffleAfter.totalEntries,
      totalFund: raffleAfter.totalFund,
      threshold: raffleAfter.threshold,
      thresholdReached: reachedThreshold,
      committed,
      graceSeconds: raffleAfter.graceSeconds,
      entryCost: raffleAfter.entryCost
    };
  }
}

// Пример фабрики (опционально можешь не использовать сейчас)
export function createJoinRaffleUseCase(
  repo: RaffleRepository,
  fairness: FairnessService,
  defaults: RaffleDefaults,
  walletProvider: WalletProvider
) {
  return new JoinRaffleUseCase(repo, fairness, defaults, walletProvider);
}

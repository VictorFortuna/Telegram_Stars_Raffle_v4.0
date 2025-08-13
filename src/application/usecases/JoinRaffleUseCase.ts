// JoinRaffleUseCase: добавление участника + commit при достижении threshold.
// Интеграция Variant B Fairness (commit только, без draw).
import { RaffleRepository } from '../../domain/repositories/RaffleRepository';
import { FairnessService } from '../../domain/services/FairnessService';
import { seedVault } from '../../infrastructure/services/SeedVault';

interface JoinInput {
  userId: bigint;
  username?: string;
}

interface JoinOutput {
  raffleId: number;
  alreadyJoined: boolean;
  status: string;
  totalEntries: number;
  totalFund: number;
  threshold: number;
  reachedThreshold: boolean;
  committed: boolean;        // произошло ли (или было уже) закрепление seedHash
  graceSeconds: number;
  entryCost: number;
}

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
    private defaults: RaffleDefaults
  ) {}

  // Основной метод
  async execute(input: JoinInput): Promise<JoinOutput> {
    // 1. Получаем или создаём активный raffle
    const active = await this.raffleRepo.findOrCreateActiveRaffle({
      threshold: this.defaults.threshold,
      entryCost: this.defaults.entryCost,
      winnerSharePercent: this.defaults.winnerSharePercent,
      commissionPercent: this.defaults.commissionPercent,
      graceSeconds: this.defaults.graceSeconds
    });

    const raffleBefore = active.toJSON();

    // 2. Пытаемся добавить участника
    const addResult = await this.raffleRepo.addEntryTransactional(active.id, input.userId);
    const raffleAfter = addResult.updatedRaffle.toJSON();

    const alreadyJoined = !addResult.created;
    const reachedThreshold = addResult.thresholdReached;
    let committed = false;

    // 3. Если достигнут threshold и ещё не статус ready -> commit
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
      raffleId: raffleAfter.id,
      alreadyJoined,
      status: raffleAfter.status,
      totalEntries: raffleAfter.totalEntries,
      totalFund: raffleAfter.totalFund,
      threshold: raffleAfter.threshold,
      reachedThreshold,
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
  defaults: RaffleDefaults
) {
  return new JoinRaffleUseCase(repo, fairness, defaults);
}

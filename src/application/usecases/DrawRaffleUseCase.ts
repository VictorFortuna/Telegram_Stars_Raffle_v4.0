// DrawRaffleUseCase: завершение розыгрыша после grace.
// Возвращает различные статусы без выбрасывания исключений в нормальных случаях.
import { RaffleRepository } from '../../domain/repositories/RaffleRepository';
import { FairnessService } from '../../domain/services/FairnessService';
import { seedVault } from '../../infrastructure/services/SeedVault';

interface DrawInput {
  raffleId?: number; // если не задан — берём активный ready
  now?: Date;
}

interface DrawSuccess {
  status: 'success';
  raffleId: number;
  winnerUserId: bigint;
  winnerIndex: number;
  participantsCount: number;
  participantsHash: string;
  winnerHash: string;
  seed: string;
  seedHash: string;
  fairnessVersion: string;
}

interface DrawResultEarly {
  status: 'too_early';
  raffleId: number;
  readyAt: string;
  graceSeconds: number;
  notReadyUntil: string;
}

interface DrawResultWrongStatus {
  status: 'wrong_status' | 'not_found' | 'missing_seed' | 'no_participants';
  raffleId?: number;
  message: string;
}

export type DrawResult =
  | DrawSuccess
  | DrawResultEarly
  | DrawResultWrongStatus;

export class DrawRaffleUseCase {
  constructor(
    private repo: RaffleRepository,
    private fairness: FairnessService
  ) {}

  async execute(input: DrawInput = {}): Promise<DrawResult> {
    let raffle = null;
    if (input.raffleId) {
      // В текущем репозитории нет метода getById публично — можно расширить при необходимости.
      // Пока просто используем findActiveRaffle и проверим id (MVP ограничение).
      const active = await this.repo.findActiveRaffle();
      if (!active || active.toJSON().id !== input.raffleId) {
        return { status: 'not_found', message: 'Raffle not found or not active', raffleId: input.raffleId };
      }
      raffle = active;
    } else {
      raffle = await this.repo.findActiveRaffle();
      if (!raffle) {
        return { status: 'not_found', message: 'No active raffle' };
      }
    }

    const r = raffle.toJSON();
    if (r.status !== 'ready') {
      return { status: 'wrong_status', message: `Raffle status is ${r.status}, expected ready`, raffleId: r.id };
    }

    const now = input.now ?? new Date();
    if (!r.readyAt) {
      return { status: 'wrong_status', message: 'readyAt missing', raffleId: r.id };
    }
    const readyMs = r.readyAt.getTime();
    const notBefore = readyMs + r.graceSeconds * 1000;
    if (now.getTime() < notBefore) {
      return {
        status: 'too_early',
        raffleId: r.id,
        readyAt: r.readyAt.toISOString(),
        graceSeconds: r.graceSeconds,
        notReadyUntil: new Date(notBefore).toISOString()
      };
    }

    // Получаем seed
    const seed = seedVault.get(r.id);
    if (!seed) {
      return { status: 'missing_seed', message: 'Seed not found in vault (process restart?)', raffleId: r.id };
    }

    // Список участников
    const participantIds = await this.repo.listEntries(r.id);
    if (participantIds.length === 0) {
      return { status: 'no_participants', message: 'No participants for raffle', raffleId: r.id };
    }

    // Вычисляем победителя
    const draw = this.fairness.computeWinner(seed, participantIds);

    // Финализируем
    const finalized = await this.repo.finalizeDraw({
      raffleId: r.id,
      seed,
      seedHash: draw.seedHash,
      winnerUserId: draw.winnerUserId,
      winnerIndex: draw.winnerIndex,
      participantsHash: draw.participantsHash,
      winnerHash: draw.winnerHash,
      fairnessVersion: 'v0b'
    });

    const f = finalized.toJSON();
    return {
      status: 'success',
      raffleId: f.id,
      winnerUserId: draw.winnerUserId,
      winnerIndex: draw.winnerIndex,
      participantsCount: participantIds.length,
      participantsHash: draw.participantsHash,
      winnerHash: draw.winnerHash,
      seed: seed,
      seedHash: draw.seedHash,
      fairnessVersion: 'v0b'
    };
  }
}
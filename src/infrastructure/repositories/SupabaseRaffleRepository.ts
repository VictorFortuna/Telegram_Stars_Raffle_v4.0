// SupabaseRaffleRepository.ts (Draft)
// NOTE: Сейчас без реальной транзакции (SIMPLE IMPLEMENTATION).
// FUTURE: заменить addEntryTransactional на вызов RPC, обеспечивающий атомарность.

import { supabase } from '../db/supabaseClient';
import { Raffle } from '../../domain/entities/Raffle';
import {
  RaffleRepository,
  CreateRaffleParams,
  AddEntryResult
} from '../../domain/repositories/RaffleRepository';

// Вспомогательная функция преобразования row -> Raffle
function mapRaffle(row: any): Raffle {
  return new Raffle({
    id: row.id,
    status: row.status,
    threshold: row.threshold,
    entryCost: row.entry_cost,
    winnerSharePercent: row.winner_share_percent,
    commissionPercent: row.commission_percent,
    totalEntries: row.total_entries,
    totalFund: row.total_fund,
    seedHash: row.seed_hash,
    seedRevealed: row.seed_revealed,
    createdAt: new Date(row.created_at),
    readyAt: row.ready_at ? new Date(row.ready_at) : null,
    drawAt: row.draw_at ? new Date(row.draw_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    forced: row.forced,
    cancelledReason: row.cancelled_reason,
    autoStartedDueToTimeout: row.auto_started_due_to_timeout,
    graceSeconds: row.grace_seconds
  });
}

export class SupabaseRaffleRepository implements RaffleRepository {

  async findActiveRaffle(): Promise<Raffle | null> {
    const { data, error } = await supabase
      .from('raffles')
      .select('*')
      .in('status', ['init','collecting','ready','drawing'])
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[findActiveRaffle] error', error);
      throw error;
    }
    if (!data || data.length === 0) return null;
    return mapRaffle(data[0]);
  }

  async createRaffle(params: CreateRaffleParams): Promise<Raffle> {
    const { data, error } = await supabase
      .from('raffles')
      .insert({
        status: 'init',
        threshold: params.threshold,
        entry_cost: params.entryCost,
        winner_share_percent: params.winnerSharePercent,
        commission_percent: params.commissionPercent,
        total_entries: 0,
        total_fund: 0,
        grace_seconds: params.graceSeconds
      })
      .select('*')
      .single();

    if (error) {
      console.error('[createRaffle] error', error);
      throw error;
    }
    return mapRaffle(data);
  }

  async findOrCreateActiveRaffle(params: CreateRaffleParams): Promise<Raffle> {
    const existing = await this.findActiveRaffle();
    if (existing) return existing;
    return this.createRaffle(params);
  }

  async userHasEntry(raffleId: number, userId: bigint): Promise<boolean> {
    const { data, error } = await supabase
      .from('raffle_entries')
      .select('id', { count: 'exact', head: true })
      .eq('raffle_id', raffleId)
      .eq('user_id', userId.toString());

    if (error) {
      console.error('[userHasEntry] error', error);
      throw error;
    }
    return (data as any) === null ? false : true; // count head: true возвращает null data
  }

  async addEntryTransactional(raffleId: number, userId: bigint): Promise<AddEntryResult> {
    // SIMPLE IMPLEMENTATION (псевдо транзакция)
    // Шаги:
    // 1. Проверка существует ли запись участия.
    // 2. Если есть — вернуть updated raffle (без изменений).
    // 3. Если нет — вставить entry, обновить raffle totals.
    // РИСК: редкая гонка при одновременном двойном join (будем решать позже).

    // 1. Проверка
    const has = await this.userHasEntry(raffleId, userId);
    if (has) {
      const raffle = await this.getRaffleById(raffleId);
      if (!raffle) throw new Error('Raffle not found after existing entry');
      return {
        updatedRaffle: raffle,
        created: false,
        thresholdReached: raffle.totalFund >= raffle.threshold
      };
    }

    // 2. Получить текущие totals (для sequence)
    const raffleBefore = await this.getRaffleById(raffleId);
    if (!raffleBefore) throw new Error('Raffle not found');

    const nextSequence = raffleBefore.totalEntries + 1;

    // 3. Вставка entry
    const { error: insertError } = await supabase
      .from('raffle_entries')
      .insert({
        raffle_id: raffleId,
        user_id: userId.toString(),
        entry_sequence: nextSequence
      });

    if (insertError) {
      console.error('[addEntryTransactional] insert entry error', insertError);
      throw insertError;
    }

    // 4. Обновить totals
    const { data: updatedRows, error: updateError } = await supabase
      .from('raffles')
      .update({
        total_entries: raffleBefore.totalEntries + 1,
        total_fund: raffleBefore.totalFund + raffleBefore.toJSON().entryCost
      })
      .eq('id', raffleId)
      .select('*');

    if (updateError) {
      console.error('[addEntryTransactional] update raffle error', updateError);
      throw updateError;
    }

    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Failed to update raffle totals');
    }

    const updatedRaffle = mapRaffle(updatedRows[0]);
    const thresholdReached = updatedRaffle.totalFund >= updatedRaffle.threshold;

    return {
      updatedRaffle,
      created: true,
      thresholdReached
    };
  }

  async commitSeedIfThreshold(
    raffleId: number,
    seedHash: string,
    graceSeconds: number
  ): Promise<Raffle> {
    // Устанавливаем seed_hash и переводим статус из init/collecting в ready (если threshold достигнут)
    const raffle = await this.getRaffleById(raffleId);
    if (!raffle) throw new Error('Raffle not found');
    if (raffle.status === 'ready' || raffle.status === 'drawing' || raffle.status === 'completed') {
      return raffle; // уже не нужно
    }
    if (raffle.totalFund < raffle.threshold) {
      return raffle; // ещё не достигнут threshold
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('raffles')
      .update({
        status: 'ready',
        seed_hash: seedHash,
        ready_at: now,
        grace_seconds: graceSeconds
      })
      .eq('id', raffleId)
      .eq('status', raffle.status) // чтобы не переписать если статус изменился конкурентно
      .select('*')
      .single();

    if (error) {
      console.error('[commitSeedIfThreshold] error', error);
      throw error;
    }

    return mapRaffle(data);
  }

  async listEntries(raffleId: number): Promise<bigint[]> {
    const { data, error } = await supabase
      .from('raffle_entries')
      .select('user_id')
      .eq('raffle_id', raffleId)
      .order('entry_sequence', { ascending: true });

    if (error) {
      console.error('[listEntries] error', error);
      throw error;
    }
    if (!data) return [];
    return data.map(r => BigInt(r.user_id));
  }

  // Внутренний helper
  private async getRaffleById(id: number): Promise<Raffle | null> {
    const { data, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('[getRaffleById] error', error);
      return null;
    }
    if (!data) return null;
    return mapRaffle(data);
  }
}
import { supabase } from '../db/supabaseClient';
import { Raffle } from '../../domain/entities/Raffle';
import {
  RaffleRepository,
  CreateRaffleParams,
  AddEntryResult
} from '../../domain/repositories/RaffleRepository';

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
    if (error) throw error;
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
    if (error) throw error;
    return mapRaffle(data);
  }

  async findOrCreateActiveRaffle(params: CreateRaffleParams): Promise<Raffle> {
    const existing = await this.findActiveRaffle();
    if (existing) return existing;
    return this.createRaffle(params);
  }

  async userHasEntry(raffleId: number, userId: bigint): Promise<boolean> {
    const { data, error, count } = await supabase
      .from('raffle_entries')
      .select('id', { head: true, count: 'exact' })
      .eq('raffle_id', raffleId)
      .eq('user_id', userId.toString());
    if (error) throw error;
    // head: true => data=null, используем count
    return (count ?? 0) > 0;
  }

  async addEntryTransactional(raffleId: number, userId: bigint): Promise<AddEntryResult> {
    // Упрощённо — без настоящей транзакции (гонки маловероятны, но возможны).
    const has = await this.userHasEntry(raffleId, userId);
    if (has) {
      const raffle = await this.getRaffleById(raffleId);
      if (!raffle) throw new Error('Raffle not found');
      return {
        updatedRaffle: raffle,
        created: false,
        thresholdReached: raffle.toJSON().totalFund >= raffle.toJSON().threshold
      };
    }

    const raffleBefore = await this.getRaffleById(raffleId);
    if (!raffleBefore) throw new Error('Raffle not found');
    const prevEntries = raffleBefore.toJSON().totalEntries;
    const nextSequence = prevEntries + 1;

    // Добавляем entry
    const { error: insertError } = await supabase
      .from('raffle_entries')
      .insert({
        raffle_id: raffleId,
        user_id: userId.toString(),
        entry_sequence: nextSequence
      });
    if (insertError) throw insertError;

    // Обновляем счётчики + если это первый участник, переводим статус init -> collecting
    const shouldFlipToCollecting = raffleBefore.toJSON().status === 'init' && prevEntries === 0;

    const { data: updatedRows, error: updateError } = await supabase
      .from('raffles')
      .update({
        total_entries: prevEntries + 1,
        total_fund: raffleBefore.toJSON().totalFund + raffleBefore.toJSON().entryCost,
        status: shouldFlipToCollecting ? 'collecting' : raffleBefore.toJSON().status
      })
      .eq('id', raffleId)
      .select('*');
    if (updateError) throw updateError;
    if (!updatedRows || updatedRows.length === 0) throw new Error('Failed to update raffle');

    const updatedRaffle = mapRaffle(updatedRows[0]);
    const thresholdReached =
      updatedRaffle.toJSON().totalFund >= updatedRaffle.toJSON().threshold;

    return { updatedRaffle, created: true, thresholdReached };
  }

  async commitSeedIfThreshold(
    raffleId: number,
    seedHash: string,
    graceSeconds: number
  ): Promise<Raffle> {
    const raffle = await this.getRaffleById(raffleId);
    if (!raffle) throw new Error('Raffle not found');
    const r = raffle.toJSON();
    if (r.status === 'ready' || r.status === 'drawing' || r.status === 'completed')
      return raffle;
    if (r.totalFund < r.threshold) return raffle;

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
      .eq('status', r.status) // оптимистичная защита
      .select('*')
      .single();
    if (error) throw error;
    return mapRaffle(data);
  }

  async listEntries(raffleId: number): Promise<bigint[]> {
    const { data, error } = await supabase
      .from('raffle_entries')
      .select('user_id')
      .eq('raffle_id', raffleId)
      .order('entry_sequence', { ascending: true });
    if (error) throw error;
    if (!data) return [];
    return data.map(r => BigInt(r.user_id));
  }

  private async getRaffleById(id: number): Promise<Raffle | null> {
    const { data, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    if (!data) return null;
    return mapRaffle(data);
  }
}

import { supabase } from '../db/supabaseClient';
import { Raffle } from '../../domain/entities/Raffle';
import {
  RaffleRepository,
  CreateRaffleParams,
  AddEntryResult,
  FinalizeDrawParams
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
    graceSeconds: row.grace_seconds,
    winnerUserId: row.winner_user_id ? BigInt(row.winner_user_id) : null,
    winnerIndex: row.winner_index,
    participantsHash: row.participants_hash,
    winnerHash: row.winner_hash,
    fairnessVersion: row.fairness_version
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
    const { count, error } = await supabase
      .from('raffle_entries')
      .select('id', { head: true, count: 'exact' })
      .eq('raffle_id', raffleId)
      .eq('user_id', userId.toString());
    if (error) throw error;
    return (count ?? 0) > 0;
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

  async addEntryTransactional(raffleId: number, userId: bigint): Promise<AddEntryResult> {
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
    const rb = raffleBefore.toJSON();
    const prevEntries = rb.totalEntries;
    const nextSequence = prevEntries + 1;

    const { error: insertError } = await supabase
      .from('raffle_entries')
      .insert({
        raffle_id: raffleId,
        user_id: userId.toString(),
        entry_sequence: nextSequence
      });
    if (insertError) throw insertError;

    const shouldFlipToCollecting = rb.status === 'init' && prevEntries === 0;

    const { data: updatedRows, error: updateError } = await supabase
      .from('raffles')
      .update({
        total_entries: prevEntries + 1,
        total_fund: rb.totalFund + rb.entryCost,
        status: shouldFlipToCollecting ? 'collecting' : rb.status
      })
      .eq('id', raffleId)
      .select('*');
    if (updateError) throw updateError;
    if (!updatedRows || updatedRows.length === 0) throw new Error('Failed to update raffle');

    const updatedRaffle = mapRaffle(updatedRows[0]);
    const thresholdReached =
      updatedRaffle.toJSON().totalFund >= updatedRaffle.toJSON().threshold;

    return { updatedRaffle, created: true, thresholdReached, entrySequence: nextSequence };
  }

  async commitSeedIfThreshold(
    raffleId: number,
    seedHash: string,
    graceSeconds: number
  ): Promise<Raffle> {
    const raffle = await this.getRaffleById(raffleId);
    if (!raffle) throw new Error('Raffle not found');
    const r = raffle.toJSON();
    if (['ready','drawing','completed'].includes(r.status)) return raffle;
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
      .eq('status', r.status)
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

  async finalizeDraw(params: FinalizeDrawParams): Promise<Raffle> {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('raffles')
      .update({
        status: 'completed',
        draw_at: nowIso,
        completed_at: nowIso,
        seed_revealed: params.seed,
        winner_user_id: params.winnerUserId.toString(),
        winner_index: params.winnerIndex,
        participants_hash: params.participantsHash,
        winner_hash: params.winnerHash,
        fairness_version: params.fairnessVersion
      })
      .eq('id', params.raffleId)
      .eq('status', 'ready')
      .eq('seed_hash', params.seedHash)
      .select('*')
      .single();
    if (error) throw error;
    return mapRaffle(data);
  }
}

export function createSupabaseRaffleRepository(): RaffleRepository {
  return new SupabaseRaffleRepository();
}

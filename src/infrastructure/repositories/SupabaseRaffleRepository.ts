// Only the changed/added parts shown below; full file будет обновлён.
// (При применении я пришлю полный файл, чтобы не было расхождений.)
...
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
...
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
...

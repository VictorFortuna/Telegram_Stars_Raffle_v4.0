// Raffle entity (Draft)
export type RaffleStatus =
  | 'init'
  | 'collecting'
  | 'ready'
  | 'drawing'
  | 'completed'
  | 'cancelled';

export interface RaffleProps {
  id: number;
  status: RaffleStatus;
  threshold: number;
  entryCost: number;
  winnerSharePercent: number;
  commissionPercent: number;
  totalEntries: number;
  totalFund: number;
  seedHash?: string | null;
  seedRevealed?: string | null;
  createdAt: Date;
  readyAt?: Date | null;
  drawAt?: Date | null;
  completedAt?: Date | null;
  forced: boolean;
  cancelledReason?: string | null;
  autoStartedDueToTimeout: boolean;
  graceSeconds: number;
}

export class Raffle {
  constructor(private props: RaffleProps) {}

  get id() { return this.props.id; }
  get status() { return this.props.status; }

  canJoin(): boolean {
    return this.props.status === 'collecting' || this.props.status === 'ready';
  }

  isReadyForDraw(now = new Date()): boolean {
    if (this.props.status !== 'ready') return false;
    if (!this.props.readyAt) return false;
    const delta = now.getTime() - this.props.readyAt.getTime();
    return delta >= this.props.graceSeconds * 1000;
  }

  toJSON(): RaffleProps {
    return { ...this.props };
  }
}
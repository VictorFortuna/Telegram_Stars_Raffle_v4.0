// Domain interface for wallet operations
export interface WalletProvider {
  getBalance(userId: bigint): Promise<number>;
  debit(userId: bigint, amount: number, reason: string): Promise<boolean>;
  credit(userId: bigint, amount: number, reason: string): Promise<boolean>;
  ensureUser(userId: bigint, initialBalance?: number): Promise<void>;
}
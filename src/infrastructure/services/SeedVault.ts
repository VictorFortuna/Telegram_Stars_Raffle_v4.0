export class SeedVault {
  private seeds = new Map<number, string>();

  storeIfAbsent(raffleId: number, seed: string): boolean {
    if (this.seeds.has(raffleId)) return false;
    this.seeds.set(raffleId, seed);
    return true;
  }
  get(raffleId: number): string | undefined {
    return this.seeds.get(raffleId);
  }
  reveal(raffleId: number): string | undefined {
    return this.seeds.get(raffleId);
  }
  delete(raffleId: number): void {
    this.seeds.delete(raffleId);
  }
}
export const seedVault = new SeedVault();

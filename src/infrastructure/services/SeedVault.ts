// SeedVault — временное (in-memory) хранилище seed до момента draw.
// MVP: при рестарте процесса seed теряется (описано в Backlog).
// Позже: заменить на устойчивое хранение (таблица raffle_secrets или зашифрованный storage).
// Политика сейчас: не перезаписывать seed, если уже есть (защита от случайного повторного commit).
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

  // На будущее: для reveal можно извлекать и (опционально) удалять.
  reveal(raffleId: number): string | undefined {
    return this.seeds.get(raffleId);
  }

  delete(raffleId: number): void {
    this.seeds.delete(raffleId);
  }
}

// Singleton (просто импортируем там где нужно)
export const seedVault = new SeedVault();
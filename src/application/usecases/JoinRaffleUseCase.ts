// JoinRaffleUseCase (Draft)
// Задача: обработать попытку пользователя присоединиться к текущему розыгрышу.
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
}

export class JoinRaffleUseCase {
  // Внедрим (dependency injection) позже:
  // constructor(private raffleRepo: RaffleRepository, private wallet: WalletProvider, ...) {}
  async execute(input: JoinInput): Promise<JoinOutput> {
    // TODO:
    // 1. Загрузить текущий raffle (или создать если нет инициализированного).
    // 2. Проверить, не участвует ли пользователь уже.
    // 3. Если нет — списать entryCost у VirtualWallet (или выдать стартовый баланс при первом входе).
    // 4. Добавить запись raffle_entries (entry_sequence).
    // 5. Обновить totalEntries / totalFund.
    // 6. Если достигнут threshold и статус=collecting — выполнить commit seed и перевести в ready.
    // 7. Вернуть агрегированную информацию.
    return {
      raffleId: 0,
      alreadyJoined: false,
      status: 'collecting',
      totalEntries: 0,
      totalFund: 0,
      threshold: 0,
      reachedThreshold: false
    };
  }
}
# VIRTUAL_WALLET_DESIGN
Status: Draft v0.1

## 1. Цель
Эмуляция экономической логики до интеграции реальных Stars.

## 2. Абстракция
interface WalletProvider { getBalance; ensureEntryCost; debitForEntry; refundEntry; payoutWinner; }

## 3. Методы
- getBalance(userId)
- ensureEntryCost(userId, cost) — проверяет или инициирует пополнение (временно можно авто-пополнение демо балансом).
- debitForEntry(userId, cost, raffleId)
- refundEntry(userId, cost, raffleId)
- payoutWinner(userId, amount, raffleId)

## 4. Жизненный цикл
Пользователь заходит → при первой попытке join, если баланс < cost → либо авто-начисление стартового демо (например 100 виртуальных звезд) → списание.

## 5. Связь с transactions
Каждая операция кошелька фикcируется (type=entry|refund|payout).

## 6. Баланс и инварианты
balance >= 0  
Сумма всех (payout + commission + остаток) = total_fund всех завершенных раундов.

## 7. Переход к реальному провайдеру
- Заменить реализацию методов.
- Добавить mapping external ids.
- Опционально отключить авто-начисление.

## 8. Ошибки и откаты
Использовать транзакции при entry, refund и draw.

## 9. Anti-abuse
Потенциально: лимит авто-пополнений, минимальный интервал join.

## 10. TBD
- Нужен ли Faucet командой /faucet? (Может быть).
- Автоматическая инициалиация демо-баланса (да/нет — решим позже).

(Конец файла)
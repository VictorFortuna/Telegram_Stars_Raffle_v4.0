# FAIRNESS

(Если у тебя уже есть разделы выше — оставь их. Ниже включены ранее описанные Implementation v0 (Variant B) + новый Proof Output.)

## Implementation v0 (Variant B)

Цель: простой, проверяемый и детерминированный способ выбора победителя без скрытых параметров (кроме seed до момента раскрытия).

### Компоненты

1. seed — случайная строка (32 байта → hex 64 символа), генерируется на этапе достижения порога (threshold).
2. seedHash = sha256(seed) — публикуется сразу (сохраняется в raffle.seed_hash).
3. participantsHash = sha256(sortedUserIds.join(',')) — вычисляется в момент draw (но любой может воспроизвести после раскрытия списка участников).
4. combined = seed + ':' + participantsHash — строка, из которой получаем winnerHash.
5. winnerHash = sha256(combined).
6. winnerIndex = (первые 16 hex символов winnerHash -> число) mod countParticipants.
7. winnerUserId = sortedUserIds[winnerIndex].

### Почему так
- Сортировка userIds фиксирует порядок.
- seedHash публикуется ДО раскрытия seed → нельзя «подобрать» seed постфактум.
- participantsHash гарантирует ссылку на конкретный состав.

### Пример (упрощённо)
(Пример с сокращёнными хешами для иллюстрации)
Participants sorted: [ 1001, 1005, 1020 ]
participantsJoined = "1001,1005,1020"
participantsHash = sha256(...) = a4d7c9...
seed = 9f2e0c4a...
seedHash = sha256(seed) = 6b8d1f...
combined = seed + ":" + participantsHash
winnerHash = sha256(combined) = 3c71bf1a2e9bd5...
first16 = 3c71bf1a2e9bd5ab
winnerIndex = (0x3c71bf1a2e9bd5ab mod 3) = 1
winnerUserId = sorted[1] = 1005

### Ограничения v0
- Нет HMAC: прозрачность > стойкость к гипотетическому подбору.
- seed хранится в памяти (SeedVault) до draw (при рестарте теряется).
- Используем 64 бита (первые 16 hex) — равномерность достаточна.

### Будущие улучшения
- HMAC / дополнительный секрет.
- Persist seed (шифрованно).
- Версионирование алгоритма (fairness_version уже добавлено).
- JSON proof endpoint / публикация.

## Proof Output (после draw)

После завершения розыгрыша сохраняются поля (таблица raffles):
- seed_hash (из commit; фиксируется заранее)
- seed_revealed (раскрытый seed)
- participants_hash
- winner_hash
- winner_index
- winner_user_id
- fairness_version (например v0b)

Публичная проверка:
1. Проверяем sha256(seed_revealed) == seed_hash.
2. Берём публичный список участников (или если он скрыт — доверяем админу). Сортируем IDs ASC.
3. joined = sorted.join(',')
4. participantsHash' = sha256(joined) → сверяем с participants_hash.
5. combined = seed_revealed + ':' + participants_hash.
6. winnerHash' = sha256(combined) → сверяем с winner_hash.
7. first16 = winner_hash[0..15] → число → mod N = winner_index'.
8. sorted[winner_index'] == winner_user_id.

Если все совпало — честность подтверждена (для fairness_version = v0b).

## Версионирование
fairness_version:
- v0b — текущая реализация (Variant B, deterministic sha256, первые 16 hex).
Будущие версии (v1, v2...) могут менять схему вычислений; верификаторы должны опираться на поле fairness_version.

## Backlog / TBD
- HMAC слой.
- Сохранение seed в БД (raffle_secrets).
- Audit log записи proof JSON.
- Endpoint /proof/{raffleId}.
- Переиспользуемый верификатор (скрипт).

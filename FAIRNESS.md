# FAIRNESS

(Существующий текст оставить выше если он уже есть — здесь добавляется/обновляется секция Implementation v0)

## Implementation v0 (Variant B)

Цель: простой, проверяемый и детерминированный способ выбора победителя без скрытых параметров (кроме seed до момента раскрытия).

### Компоненты

1. seed — случайная строка (32 байта → hex 64 символа), генерируется на этапе достижения порога (threshold).
2. seedHash = sha256(seed) — публикуется сразу (сохраняется в raffle.seed_hash).
3. participantsHash = sha256(sortedUserIds.join(',')) — вычисляется в момент draw (но любой может воспроизвести после раскрытия списка участников).
4. combined = seed + ':' + participantsHash — строка, из которой мы делаем winnerHash.
5. winnerHash = sha256(combined).
6. winnerIndex = (первые 16 hex символов winnerHash -> число) mod countParticipants.
7. winnerUserId = sortedUserIds[winnerIndex].

### Почему так

- Сортировка userIds гарантирует одинаковый порядок у всех проверяющих.
- seedHash публикуется ДО раскрытия seed → нельзя «подобрать» seed после просмотра участников.
- Использование participantsHash позволяет удостовериться, что список участников не менялся между commit и draw.

### Пример

(Чисто демонстрационный; значения не настоящие.)

```
Participants (raw order they joined):
[ 5551110001, 5551110007, 5551110003 ]

Sorted:
[ 5551110001, 5551110003, 5551110007 ]

participantsJoined = "5551110001,5551110003,5551110007"
participantsHash = sha256(participantsJoined)
= a4d7c9... (64 hex)

seed = 9f2e0c4a5d... (64 hex)
seedHash = sha256(seed)
= 6b8d1f... (64 hex)  --> это мы знали заранее из raffle.seed_hash

combined = seed + ":" + participantsHash
winnerHash = sha256(combined)
= 3c71bf1a2e9bd5... (64 hex)

first16 = 3c71bf1a2e9bd5ab
number = 0x3c71bf1a2e9bd5ab (в десятичной форме большое число)
winnerIndex = number mod 3
= 1

winnerUserId = sorted[1] = 5551110003
```

### Проверка сторонним наблюдателем

После завершения и раскрытия seed + списка участников:
1. Сортирует IDs → формирует participantsJoined.
2. Делает participantsHash = sha256(participantsJoined).
3. Проверяет sha256(seed) == seedHash (из raffle).
4. Делает combined = seed + ':' + participantsHash.
5. Вычисляет sha256(combined) → winnerHash.
6. Берёт первые 16 hex → число → mod на количество участников → winnerIndex.
7. Сравнивает userId по этому индексу с объявленным победителем.

Если всё совпало — честность подтверждена.

### Ограничения v0

- Нет HMAC с секретом сервера: любой может смоделировать все шаги — это нормально для прозрачности. (HMAC можно добавить позже для защиты от гипотетического «подбора seed» при большом количестве commit попыток — сейчас seed генерируется один раз сервером внутрь, без перебора.)
- Секрет (seed) хранится в памяти до момента draw (позже можно: зашифрованное хранение в БД / redis).
- Использование только первых 16 hex символов winnerHash — достаточно (64 бита) для равномерного распределения; можно брать больше / всё — результат не меняется по равномерности.

### Будущие улучшения (Backlog)

- Добавить HMAC(seed, serverSecret) или serverSecret для второго слоя.
- Публиковать участника (winner proof) в формате JSON с полным набором хешей.
- Версионирование алгоритма (fairness_version в таблице raffles).

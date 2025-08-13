# FAIRNESS
Status: Draft v0.1 (Updated with example)

## 1. Цель
Обеспечить прозрачную и проверяемую процедуру выбора победителя.

## 2. Модель
Commit–Reveal: публикуем hash(seed) до генерации результата. После — раскрываем seed. Используем HMAC для вычисления победителя.

## 3. Алгоритм (кратко)
1. При достижении threshold → генерируем seed (128 бит random).
2. seed_hash = SHA256(seed).
3. Публикуем seed_hash.
4. После grace_period → собираем упорядоченный список user_id.
5. Формируем JSON списка участников.
6. hmac = HMAC_SHA256(seed, participants_json).
7. Превращаем hmac (hex) в число.
8. winner_index = число mod N.
9. Победитель = список[winner_index].
10. Раскрываем seed и выдаём данные для проверки.

## 4. Формат seed / hash
- seed: 32 байта → hex (64 символа).
- seed_hash: SHA256(seed).

## 5. Формула
winner_index = BigInt(HMAC_SHA256(seed, participants_json)) mod N

## 6. Пример (Черновик)
Предположим:
- Участники (по порядку присоединения) user_id: [1111, 2222, 3333, 4444, 5555] (N=5)
- seed (генерируется при переходе в ready, скрыт до завершения):  
  seed = d4f7c9b23aa8f8e2b6d9ee0e3f4c1a0bb9f2bd0c6af7c122d9f0c0ab55c9d312
- seed_hash = SHA256(seed) = (пример) 9d7b1e6f4c6b23a0d2f4c1a... (усечено)

JSON участников (строка):
["1111","2222","3333","4444","5555"]

hmac = HMAC_SHA256(seed, participants_json)  
Допустим результат:
hmac(hex) = 54c5f9e3b9d6a1ab17f2d0c41f9e881d0e7d55c3f4d2a9b7c6e8a1c2d3e4f5a1

Преобразуем первые 16 hex (например) или всё значение в BigInt:
value = BigInt('0x54c5f9e3b9d6a1ab17f2d0c41f9e881d0e7d55c3f4d2a9b7c6e8a1c2d3e4f5a1')

winner_index = value mod 5  
Допустим value mod 5 = 3 → индекс 3 (с нуля) → победитель user_id = 4444.

Публикуем:
- seed
- seed_hash
- hmac
- participants_hash = SHA256("1111:2222:3333:4444:5555")
- winner_index = 3
- победитель: 4444

Пользователь может пересчитать локально и убедиться.

(Реальные значения seed_hash и hmac будут иными — этот пример иллюстративный.)

## 7. Команды / API
/fairness, /details <id> и WebApp панель.

## 8. Хеш списка участников
participants_hash = SHA256(concat user_id через ':')

## 9. Потенциальные атаки
(см. прежний список — не изменилось)

## 10. Улучшения
Внешние источники случайности, объединённый seed.

## 11. Инструкция
1. Взять seed → SHA256 → сверить.
2. Получить список (или его hash).
3. Сформировать JSON, посчитать HMAC.
4. mod N → индекс → сравнить.

## 12. TBD
Добавить автоматическую утилиту проверки (WebApp).

(Конец файла)
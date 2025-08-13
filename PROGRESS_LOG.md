# PROGRESS_LOG
Status: Ongoing (Append-Only)

Инструкция по редактированию:
- Не удаляй прошлые секции (хронология важна).
- Новые изменения → добавь новую секцию в конец.
- Если правим уже существующую дату — помечаем (Updated: …) внутри, но это НЕ норма для завершённых дней.

Format секции:
### YYYY-MM-DD (Краткий заголовок)
События:
- ...
Решения:
- ...
Next Actions:
- ...
Backlog / TBD:
- ...

---

### 2025-08-12 (Инициализация)
События:
- Определён формат проекта: игра-розыгрыш с виртуальными Stars (режим DEMO).
- Сформирован комплект технической документации (DEVELOPMENT_PLAN, DATABASE_SCHEMA, FAIRNESS, PROJECT_STRUCTURE, CONFIGURATION и др.).
- Обозначена модель честности (commit–reveal + HMAC).
- Описана стратегия перехода к реальным Telegram Stars.
Решения:
- Один активный raffle одновременно.
- Виртуальная модель (MODE=VIRTUAL) до появления надёжной интеграции Stars.
- Распределение фонда: 70% победителю / 30% комиссия (регулируемо в будущем).
- Автостарт розыгрыша через 24 часа даже если threshold не достигнут.
- Grace period при достижении threshold: 30 секунд.
- Публичность участников: только count + hash, полный список — админу.
- Supabase используем сразу (без промежуточных JSON/Memory).
Next Actions:
- Подготовить baseline файлов и миграций (Variant B).
Backlog / TBD:
- TELEGRAM_STARS_OPTIONS.md (исследование).
- Пример расчёта fairness (детализировать).
- Jackpot / multi-entry в будущем.
- WebApp дизайн (позже).

### 2025-08-13 (Variant B baseline подготовка)
События:
- Сформированы черновики файлов для Variant B (каркас проекта, миграции, сущности, интерфейсы).
- Выбран формат репозитория: VictorFortuna/Telegram_Stars_Raffle_v4.0.
- Принято решение двигаться аккуратно (без слишком быстрого массового коммита).
Решения:
- Используем localhost URL для WEBAPP (http://localhost:5173) в .env.example.
- Ведение PROGRESS_LOG как append-only (уточнено после обнаружения перезаписи).
Next Actions (ещё не выполнены на момент фиксации):
- Создать ветку feature/variant-b-setup (или уже отражено, если ты её создал — добавить отметку).
- Добавить baseline файлы через PR (не прямой push).
- Применить миграции в Supabase после мержа.
Backlog / TBD:
- Выбор следующего шага (RaffleRepository vs FairnessService).
- Настройка бот-скелета (/start, /status).
- Faucet / начальный демо баланс политика.

### 2025-08-13 (После фиксации baseline) (ЗАГОТОВКА — заполнить после завершения PR)
События:
- (Заполнить после мержа PR)
Решения:
- (Заполнить)
Next Actions:
- (Определить)
Backlog / TBD:
- (Автоматическое перенесение сюда не требуется, используем общую секцию выше)

### 2025-08-13 (RaffleRepository каркас + Проверка репозитория)
События:
- Добавлены файлы: RaffleRepository (интерфейс), SupabaseRaffleRepository (черновая реализация без транзакций), supabaseClient.
- Подтверждено наличие миграции init_core (enum raffle_status без IF NOT EXISTS — допишем позже при необходимости).
- Проверена базовая структура: ключевые файлы присутствуют (README, PROGRESS_LOG, .env.example, config).
- Пользователь подтвердил добавление файлов локально и заливку в репозиторий.
Решения:
- Пока используем псевдо-транзакцию для addEntry (может иметь редкую гонку — допустимо на MVP).
- Seed/commit логика и FairnessService — следующий шаг.
Next Actions:
- Реализовать FairnessService: генерация seed, hash (sha256), определение победителя (HMAC или прямой deterministic random), participantsHash.
- После реализации — интегрировать commitSeedIfThreshold c FairnessService.generateCommit().

- ### 2025-08-13 (Join интеграция + commit fairness)
События:
- Реализован FairnessService (Variant B: seed + seedHash + participantsHash → winnerHash).
- Добавлен SeedVault (in-memory) для хранения seed до момента draw.
- Обновлён SupabaseRaffleRepository: статус init → collecting при первом участнике; commitSeedIfThreshold оптимистично переводит raffle в ready.
- Обновлён JoinRaffleUseCase: теперь при достижении threshold выполняет fairness commit (генерирует seed, сохраняет seedHash в БД, seed кладёт в SeedVault).
- Проведена ручная интеграция (пользователь подтвердил «Интеграция применена»).
Решения:
- Seed не persists (при рестарте — потеря; допустимо для MVP).
- Псевдо‑транзакции без блокировок — риск гонки минимальный (будет улучшено позже).
- commit выполняется ровно один раз за счёт проверки статуса и оптимистичного update.
Next Actions:
- Добавить функциональность draw (выбор победителя после grace): DrawRaffleUseCase.
- Расширить схему для хранения результатов (winner_user_id, winner_index, participants_hash, winner_hash) — обсудить формат.
- Реализовать reveal: записать seed_revealed, winner_* поля, статус -> completed.
- Обновить FAIRNESS.md примером полного proof после draw.
Backlog / TBD:
- Persist seed (таблица raffle_secrets или шифрованное хранение).
- Атомарный join через RPC/SQL (уменьшение гонок).
- Авто-триггер draw по таймеру (cron / background job).
- Формирование JSON proof (для API / публикации в канале).
- Версионирование fairness алгоритма в таблице (fairness_version).
Backlog / TBD:
- RPC/SQL функция для атомарного join (уменьшить гонки).
- Обновить миграцию / добавить новую с безопасным ENUM IF NOT EXISTS (при появлении новой среды).
- Логика смены статуса init -> collecting при первом участнике.
---
(Добавляй новую секцию ниже этой линии по мере прогресса.)

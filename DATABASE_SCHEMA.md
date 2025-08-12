# DATABASE_SCHEMA
Status: Draft v0.1

## 1. Принципы
- Явная фиксация каждого значимого события.
- Минимальная нормализация (избегаем денормализации пока).
- Предсказуемость транзакций: join → insert entry + update raffle totals.
- Подготовка к расширению (multi-entry, jackpots).

## 2. Таблицы

### 2.1 users
| поле | тип | описание |
| id | bigint (Telegram user id) PK | уникальный идентификатор |
| username | text nullable | Telegram username |
| first_seen_at | timestamptz | первое взаимодействие |
| last_seen_at | timestamptz | последнее взаимодействие |
| total_entries | int default 0 | агрегат |
| total_wins | int default 0 |
| total_contributed | int default 0 | суммарно внесённых виртуальных Stars |
| total_won | int default 0 |
| created_at | timestamptz default now() |

### 2.2 raffles
| поле | тип |
| id | serial PK |
| status | text (init|collecting|ready|drawing|completed|cancelled) |
| threshold | int |
| entry_cost | int (default 1) |
| winner_share_percent | int (default 70) |
| commission_percent | int (default 30) |
| total_entries | int default 0 |
| total_fund | int default 0 |
| seed_hash | text |
| seed_revealed | text nullable |
| created_at | timestamptz default now() |
| ready_at | timestamptz nullable |
| draw_at | timestamptz nullable |
| completed_at | timestamptz nullable |
| forced | boolean default false |
| cancelled_reason | text nullable |
| auto_started_due_to_timeout | boolean default false |
| grace_seconds | int default 30 |

### 2.3 raffle_entries
| поле | тип |
| id | serial |
| raffle_id | int FK |
| user_id | bigint FK |
| joined_at | timestamptz default now() |
| entry_sequence | int | порядковый номер (row_number) |
| refunded | boolean default false |
Уникальность: (raffle_id, user_id).

### 2.4 balances (виртуальные)
| user_id | bigint PK |
| balance | int default 0 |
| updated_at | timestamptz |

### 2.5 transactions
| id | serial |
| user_id | bigint nullable |
| raffle_id | int nullable |
| type | text (entry|payout|refund|commission_adjust|correction) |
| amount | int | положительное = начисление, отрицательное = списание |
| meta | jsonb nullable |
| created_at | timestamptz default now() |

### 2.6 audit_log
| id | serial |
| scope | text (raffle|system|wallet) |
| ref_id | int nullable |
| action | text |
| data | jsonb |
| created_at | timestamptz default now() |

### 2.7 system_settings
| key | text PK |
| value | text |
| updated_at | timestamptz |

## 3. Связи и индексы
- FK: raffle_entries.raffle_id → raffles.id ON DELETE CASCADE.
- Индекс: raffle_entries (raffle_id).
- Индекс: transactions (raffle_id), (user_id).
- users(id) PK.
- balances(user_id) FK users.

## 4. Жизненный цикл raffle
init → collecting (старт при первой регистрации участника)  
collecting → ready (total_fund >= threshold → seed_hash фиксируется)  
ready → drawing (после grace_period)  
drawing → completed (winner определён, транзакции payout + commission)  
Любое состояние → cancelled (refund всем, seed_revealed = NULL).

## 5. Транзакционные сценарии
### Join
1. BEGIN
2. SELECT raffle FOR UPDATE (status проверка)
3. Проверка (нет entry пользователя)
4. INSERT raffle_entries
5. UPDATE raffles SET total_entries++, total_fund+=entry_cost
6. Если threshold достигнут и status=collecting → генерировать seed + seed_hash, обновить status=ready, ready_at, grace_seconds
7. COMMIT

### Draw
1. BEGIN
2. SELECT raffle FOR UPDATE (status=ready)
3. SELECT entries ORDER BY entry_sequence
4. Вычислить winner_index
5. INSERT transactions (payout winner_share, commission)
6. UPDATE users (winner stats)
7. UPDATE raffles (winner_user_id, status=completed, seed_revealed, draw_at, completed_at)
8. COMMIT

### Cancel
1. BEGIN
2. SELECT raffle FOR UPDATE
3. SELECT entries
4. INSERT transactions refund каждому (amount = entry_cost)
5. UPDATE raffle_entries SET refunded=true
6. UPDATE raffles SET status=cancelled, cancelled_reason
7. COMMIT

## 6. Миграции
- Используем SQL файлы в /migrations с префиксом timestamp.
- Нумерация: YYYYMMDDHHMM__create_tables.sql
- Применение: вручную через Supabase CLI (инструкция позже).

## 7. Переход к реальным Stars
- balances и часть типов transactions могут быть пересмотрены.
- Добавится mapping реальных операций (external_operation_id).
- WalletProvider сменится, схема остаётся совместимой (transactions расширяется).

## 8. Политики безопасности (RLS) (будущее)
MVP: без публичного прямого доступа к таблицам (серверный бэкенд).
Позже: RLS для WebApp прямых запросов (если захотим клиентский доступ Supabase SDK).

## 9. ERD (TBD)
Добавим позже в виде изображения или markdown-диаграммы.

## 10. TBD
- Нужно ли хранить hash списка участников отдельно? Сейчас достаточно seed + порядок.
- Добавить поле jackpot_amount (будущее).
- Ограничения: максимальный threshold?

(Конец файла)
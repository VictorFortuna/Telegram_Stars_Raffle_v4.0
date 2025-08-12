# PROJECT_STRUCTURE
Status: Draft v0.1

## 1. Обзор слоёв
- Domain (core логика: сущности, правила, сервисы)
- Application (координация use-cases: RaffleService, WalletService)
- Infrastructure (доступ к БД, адаптеры Supabase, хранилище конфигурации)
- Interfaces:
  - Bot (Telegraf)
  - HTTP API (Express/Fastify)
  - WebApp (frontend React)
  - (Будущее) Admin UI

## 2. Директории (первоначально)
```
/src
  /config
  /domain
    /entities
    /services
    /value-objects
  /application
    /usecases
  /infrastructure
    /db
    /wallet
    /fairness
  /interfaces
    /bot
    /http
  /utils
/webapp   (появится на этапе 3)
  /src
/migrations (SQL для Supabase)
/docs (необязательные вспомогательные материалы)
/scripts
```

## 3. План расширения для WebApp
- /webapp/src/components
- /webapp/src/api (fetch клиенты)
- /webapp/src/state (zustand/redux или простой react state)
- Разделение: Core UI (RaffleStatus, JoinButton, FairnessPanel).

## 4. Конвенции именования
- camelCase для JS/TS.
- CONSTANT_CASE для переменных окружения.
- snake_case для названий таблиц в БД.

## 5. Временная упрощённая структура (до WebApp)
Только /src + bot + необходимый сервис + минимум config.

## 6. Механизм конфигурации
- config/index.ts собирает значения из process.env со схемой (валидация через zod / кастом).
- Предусмотреть config.mode (virtual|future_real).

## 7. Логи и аудит
- Логгер (console на старте) → позже pino/winston.
- audit_log пишется через AuditService с типами событий.

## 8. Переход к реальным Stars
- Интерфейс WalletProvider остаётся.
- Добавление StarsWalletProvider с конкретной интеграцией.
- Вся бизнес-логика не меняется, только имплементация методов debit/payout.

## 9. Диаграмма слоёв (ASCII)
```
+----------------------------+
|        WebApp (UI)         |
+--------------+-------------+
               |
        HTTP API (REST/SSE)
               |
        Application Layer
   (UseCases: join, draw, cancel)
               |
           Domain Core
 (Entities: Raffle, Entry, User,
  Services: Fairness, RaffleRules)
               |
         Infrastructure
 (DB Repos, WalletProvider,
  Audit, Config)
               |
          PostgreSQL (Supabase)
```

## 10. TBD
- Выбор HTTP фреймворка (Fastify vs Express) → предложено Fastify (производительнее, но можно Express для простоты).
- Стратегия кеширования (не нужна в MVP).
- Обработка конкурентных join (требуется транзакция — уточнить механизм в Supabase).

(Конец файла)
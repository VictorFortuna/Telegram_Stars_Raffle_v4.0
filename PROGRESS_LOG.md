### 2025-08-13 (Variant B baseline files committed via PR)
События:
- Добавлены стартовые миграции (init_core, audit_and_transactions).
- Добавлены каркасные сущности Raffle, FairnessService интерфейс, JoinRaffleUseCase заготовка.
- Созданы .env.example, .gitignore, README.md, DEV_NOTES.
- FAIRNESS.md дополнен примером.

Решения:
- URL WebApp пока (TBD/placeholder).
- Следующий шаг будет выбран после мержа (приоритет пока не установлен).

Next Actions (кандидаты):
- Реализация RaffleRepository (Supabase).
- Реализация FairnessService (генерация seed + HMAC).
- Реализация JoinRaffleUseCase логики.

Backlog:
- TELEGRAM_STARS_OPTIONS.md
- Faucet / стартовый баланс логика
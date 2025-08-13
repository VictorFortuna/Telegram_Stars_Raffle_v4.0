# DEV_NOTES (Draft)
Кратко: как применить миграции локально (Supabase CLI или SQL консолем).

## Вариант 1: Supabase CLI
1. Установить: https://supabase.com/docs/guides/cli
2. В корне проекта:
   supabase db push   (если настроен конфиг) — ИЛИ выполнить вручную.

## Вариант 2: Через Web консоль
1. Открыть проект → SQL Editor.
2. Скопировать содержимое `migrations/20250813_1000__init_core.sql` → Run.
3. Затем `migrations/20250813_1100__audit_and_transactions.sql`.

## Проверка
- SELECT * FROM raffles;
- Таблицы созданы? Ок.

## Дальше
Миграции НЕ редактируем после применения. Изменения → новый файл с новым timestamp.
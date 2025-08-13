# Telegram Stars Raffle (MVP – Virtual Mode)

Статус: Стартовая структура (Variant B baseline).

## Что это
Мини-игра (Telegram Mini App + бот) с розыгрышем призового фонда. Сейчас используется виртуальная валюта (демо) — позже планируется переход на реальные Telegram Stars.

## Основные характеристики (MVP)
- Один активный розыгрыш.
- Участие: фиксированная ставка (1 виртуальная "звезда").
- Порог фонда + автозапуск через 24 часа.
- Честность: commit–reveal (seed hash) + HMAC.
- 70% победителю / 30% комиссия.
- Виртуальный кошелёк (позже — реальный).

## Стек
- Node.js (бот + HTTP API)
- Supabase (PostgreSQL)
- (Этап 3) WebApp (React/Vite)

## Структура
Смотри PROJECT_STRUCTURE.md

## Документация
DEVELOPMENT_PLAN, DATABASE_SCHEMA, FAIRNESS и др. Прогресс фиксируется в PROGRESS_LOG.md.

## Запуск (предварительно)
1. cp .env.example .env
2. Заполнить ADMIN_USER_ID, TELEGRAM_BOT_TOKEN (когда будет), Supabase ключи.
3. Применить миграции (см. scripts/DEV_NOTES.md).
4. (Код пока каркасный) — дальше будут сервисы и бот.

## Лицензия
TBD.
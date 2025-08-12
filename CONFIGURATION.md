# CONFIGURATION
Status: Draft v0.1

## 1. Переменные окружения
| Имя | Назначение |
| ADMIN_USER_ID | Telegram ID админа |
| TELEGRAM_BOT_TOKEN | Токен бота |
| TELEGRAM_WEBAPP_URL | URL WebApp |
| MODE | VIRTUAL / FUTURE_REAL |
| DEFAULT_THRESHOLD | Стартовый порог фонда |
| MIN_THRESHOLD | Минимально допустимый порог |
| GRACE_PERIOD_SECONDS | Пауза после достижения threshold |
| FORCE_START_AFTER_HOURS | Автостарт после X часов |
| WINNER_SHARE_PERCENT | Процент победителю |
| COMMISSION_PERCENT | Процент комиссии |
| CURRENCY_SYMBOL | Значок для UI |
| SUPABASE_URL | URL проекта |
| SUPABASE_ANON_KEY | Публичный ключ |
| SUPABASE_SERVICE_ROLE_KEY | Секретный сервисный ключ |
| LOG_LEVEL | info|debug|error |
| API_PORT | порт HTTP API |
| WEBAPP_ALLOWED_ORIGINS | список доменов |
| ENABLE_AUTO_CREATE_NEXT | автосоздание следующего raffle |
| FAIRNESS_HASH_ALGO | sha256 |
| FAIRNESS_HMAC_ALGO | sha256 |

## 2. Значения по умолчанию
Часть задаётся в коде (fallback), приоритет у .env.

## 3. .env.example
Будет создан отдельным файлом после подтверждения.

## 4. Управление секретами
- Локально: .env (в .gitignore).
- Прод: GitHub Actions Secrets / отдельный хостинг.

## 5. Режимы
MODE=VIRTUAL → VirtualWalletProvider  
MODE=FUTURE_REAL → StarsWalletProvider (TBD).

## 6. Настройки долей
winner_share + commission = 100 (пока). Jackpot позже скорректирует.

## 7. Threshold / Grace
Настройки могут быть изменены админ-командами при живом raffle только на «следующий».

## 8. Логи
Легкий логгер (console) → расширим.

## 9. Изменение конфигурации
- Статичные (BOT_TOKEN) — через перезапуск.
- Динамические (threshold) — system_settings или в памяти.

## 10. TBD
- Хранить текущие runtime настройки в system_settings? (Да, позже.)
- Ввести version конфигурации.

(Конец файла)
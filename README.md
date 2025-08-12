# Telegram Stars Raffle

![Build Status](https://github.com/VictorFortuna/Telegram_Stars_Raffle_v4.0/actions/workflows/main.yml/badge.svg)
![License](https://img.shields.io/github/license/VictorFortuna/Telegram_Stars_Raffle_v4.0)
![Repo Size](https://img.shields.io/github/repo-size/VictorFortuna/Telegram_Stars_Raffle_v4.0)

## Краткое описание

Telegram Stars Raffle — это автоматизированная платформа для проведения честных розыгрышей (raffle/лотерей) в Telegram с использованием платежной системы Telegram Stars. Проект обеспечивает прозрачность, безопасность и удобство для пользователей, организаторов и победителей.

## Основные возможности

- Интеграция с Telegram Stars для платежей и идентификации
- Прозрачный механизм выбора победителей
- Удобный интерфейс для организации и управления розыгрышами
- Защита данных и безопасность операций
- Гибкая архитектура, ориентированная на масштабирование

## Технологический стек

- Backend: Python (FastAPI)
- Database: PostgreSQL
- Frontend: React.js (или другой, см. PROJECT_STRUCTURE.md)
- Docker для контейнеризации
- Telegram API/Stars API

## Документация проекта

- [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) — поэтапный план разработки
- [DEVELOPMENT_METHODOLOGY.md](./DEVELOPMENT_METHODOLOGY.md) — методология и стандарты работы
- [PROJECT_ANALYSIS_CHECKLIST.md](./PROJECT_ANALYSIS_CHECKLIST.md) — бизнес-цели, требования, риски
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) — описание backend-эндпоинтов
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — схема и описание базы данных
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — структура папок, файлов и назначение

## Быстрый старт

### Клонирование репозитория

```bash
git clone https://github.com/VictorFortuna/Telegram_Stars_Raffle_v4.0.git
cd Telegram_Stars_Raffle_v4.0
```

### Настройка окружения

1. Создайте файл `.env` на основе шаблона `.env.example`.
2. Заполните переменные окружения:
   - `TELEGRAM_BOT_TOKEN=...`
   - `TELEGRAM_STARS_API_KEY=...`
   - `DATABASE_URL=...` (например, для PostgreSQL)
   - Другие, согласно [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

### Запуск с помощью Docker

```bash
docker-compose up --build
```

### Локальный запуск (без Docker)

- Backend:  
  ```bash
  cd backend
  pip install -r requirements.txt
  uvicorn main:app --reload
  ```
- Frontend:  
  ```bash
  cd frontend
  npm install
  npm start
  ```

## Ссылки на дополнительные документы

- [Требования и цели](./PROJECT_ANALYSIS_CHECKLIST.md)
- [Этапы и контрольные точки](./DEVELOPMENT_PLAN.md)
- [Архитектура и структура](./PROJECT_STRUCTURE.md)
- [Схема базы данных](./DATABASE_SCHEMA.md)
- [API эндпоинты](./API_ENDPOINTS.md)
- [Методология и стандарты](./DEVELOPMENT_METHODOLOGY.md)

## Контрибьюторы

- VictorFortuna (автор и основной разработчик)
- [Добавьте сюда других участников, если появятся]

## Лицензия

MIT License. Подробности см. в файле [LICENSE](./LICENSE).

## Обратная связь и поддержка

По вопросам и предложениям — пишите в Telegram: @VictorFortuna

---

**Перед началом работы обязательно ознакомьтесь с DEVELOPMENT_PLAN.md и PROJECT_ANALYSIS_CHECKLIST.md!**

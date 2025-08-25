# Telegram Stars Raffle Bot - Setup Guide

This guide helps you set up and run the Telegram Stars Raffle Bot.

## Prerequisites

1. **Node.js 18+** installed
2. **Telegram Bot Token** from @BotFather
3. **Supabase Project** with database access

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
Apply the migrations to your Supabase database in order:

```sql
-- 1. Run: migrations/20250813_1000__init_core.sql
-- 2. Run: migrations/20250813_1100__audit_and_transactions.sql  
-- 3. Run: migrations/20250813_1200__raffle_winner_fields.sql
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `TELEGRAM_BOT_TOKEN` - Your bot token from @BotFather
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `ADMIN_USER_ID` - Your Telegram user ID (for admin commands)

### 4. Build and Run

```bash
# Build the project
npm run build

# Start the bot
npm start

# Or run in development mode with hot reload
npm run dev
```

## Testing

Run the manual test to verify everything works:

```bash
npm run test:manual
```

This will:
1. Create test users with virtual balances
2. Simulate joining a raffle 
3. Execute the complete fairness flow
4. Draw a winner and verify results

## Bot Commands

### User Commands
- `/start` - Welcome message and main menu
- `/status` - Current raffle status
- `/join` - Join the current raffle  
- `/balance` - Check your virtual star balance
- `/fairness` - Information about fairness system
- `/help` - Command list

### Admin Commands (requires ADMIN_USER_ID)
- `/admin_draw` - Force draw current raffle

## How It Works

1. **Virtual Mode**: Uses virtual stars (demo currency)
2. **Initial Balance**: New users get 100 ⭐ to start
3. **Entry Cost**: 1 ⭐ per raffle entry
4. **Threshold**: Configurable participants needed to start
5. **Grace Period**: 30 seconds after threshold for late joiners
6. **Fairness**: Cryptographic proof using SHA256 commitment scheme

## Configuration

Key settings in `.env`:
- `DEFAULT_THRESHOLD=1000` - Participants needed to start raffle
- `GRACE_PERIOD_SECONDS=30` - Time after threshold before draw
- `WINNER_SHARE_PERCENT=70` - Winner gets 70% of pot
- `COMMISSION_PERCENT=30` - House commission 30%

## Architecture

```
src/
├── domain/          # Core business logic
├── application/     # Use cases (Join, Draw)
├── infrastructure/  # Database, Services
└── interfaces/      # Bot, HTTP API (future)
```

## Troubleshooting

### Bot not responding
- Check `TELEGRAM_BOT_TOKEN` is correct
- Verify bot is not already running elsewhere  
- Check console logs for errors

### Database errors  
- Verify Supabase connection details
- Ensure all migrations are applied
- Check Supabase logs for permission issues

### Test failures
- Ensure database is accessible
- Check environment variables are set
- Verify migrations completed successfully

## Next Steps

After basic setup works:
1. Deploy to production server
2. Set up monitoring/logging
3. Add WebApp Mini App interface
4. Implement real Telegram Stars when available

## Support

Check the documentation files:
- `FAIRNESS.md` - How fairness system works
- `DATABASE_SCHEMA.md` - Database structure  
- `DEVELOPMENT_PLAN.md` - Roadmap and features
- `PROGRESS_LOG.md` - Latest changes and status
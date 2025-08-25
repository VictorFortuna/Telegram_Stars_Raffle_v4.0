// Basic config loader (Draft)
// Минимальная версия — без внешних библиотек. Позже можно добавить zod.

interface AppConfig {
  adminUserId: string;
  mode: 'VIRTUAL' | 'FUTURE_REAL';
  defaultThreshold: number;
  minThreshold: number;
  gracePeriodSeconds: number;
  forceStartAfterHours: number;
  winnerSharePercent: number;
  commissionPercent: number;
  apiPort: number;
  logLevel: string;
  enableAutoCreateNext: boolean;
  // Bot & DB
  telegramBotToken: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  nodeEnv: string;
}

function requireEnv(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (!v) {
    throw new Error(`Missing required env: ${key}`);
  }
  return v;
}

export const config: AppConfig = {
  adminUserId: requireEnv('ADMIN_USER_ID', '0'),
  mode: (process.env.MODE as 'VIRTUAL' | 'FUTURE_REAL') || 'VIRTUAL',
  defaultThreshold: parseInt(requireEnv('DEFAULT_THRESHOLD', '1000'), 10),
  minThreshold: parseInt(requireEnv('MIN_THRESHOLD', '100'), 10),
  gracePeriodSeconds: parseInt(requireEnv('GRACE_PERIOD_SECONDS', '30'), 10),
  forceStartAfterHours: parseInt(requireEnv('FORCE_START_AFTER_HOURS', '24'), 10),
  winnerSharePercent: parseInt(requireEnv('WINNER_SHARE_PERCENT', '70'), 10),
  commissionPercent: parseInt(requireEnv('COMMISSION_PERCENT', '30'), 10),
  apiPort: parseInt(requireEnv('API_PORT', '3000'), 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  enableAutoCreateNext: requireEnv('ENABLE_AUTO_CREATE_NEXT', '1') === '1',
  // Bot & DB
  telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseAnonKey: requireEnv('SUPABASE_ANON_KEY'),
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Простая проверка суммы процентов
if (config.winnerSharePercent + config.commissionPercent !== 100) {
  // Пока просто предупреждение
  console.warn('[config] Warning: winner + commission != 100 (jackpot еще не реализован)');
}
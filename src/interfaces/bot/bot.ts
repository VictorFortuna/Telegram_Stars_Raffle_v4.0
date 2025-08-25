// Telegram bot interface
import { Telegraf, Context, Markup } from 'telegraf';
import { config } from '../../config';
import { JoinRaffleUseCase } from '../../application/usecases/JoinRaffleUseCase';
import { DrawRaffleUseCase } from '../../application/usecases/DrawRaffleUseCase';
import { RaffleRepository } from '../../domain/repositories/RaffleRepository';
import { WalletProvider } from '../../domain/services/WalletProvider';

interface BotDependencies {
  joinRaffleUseCase: JoinRaffleUseCase;
  drawRaffleUseCase: DrawRaffleUseCase;
  raffleRepository: RaffleRepository;
  walletProvider: WalletProvider;
}

export function createBot(deps: BotDependencies): Telegraf {
  const bot = new Telegraf(config.telegramBotToken);

  // Start command
  bot.start(async (ctx) => {
    const userId = BigInt(ctx.from!.id);
    const username = ctx.from!.username || ctx.from!.first_name;
    
    console.log(`New user started bot: ${userId} (${username})`);
    
    const welcomeMessage = `
🎰 *Добро пожаловать в Telegram Stars Raffle!*

Это честная система розыгрышей с гарантированной справедливостью.

📋 *Доступные команды:*
/status - Текущее состояние розыгрыша
/join - Участвовать в розыгрыше  
/balance - Проверить баланс
/fairness - Информация о честности
/help - Список команд

💡 *Как это работает:*
• Фиксированная ставка: 1 виртуальная звезда
• Автоматический старт при достижении порога участников
• 100% честность через криптографические доказательства

💰 *Начальный баланс: 100 ⭐* (виртуальные звезды для демо)
`;

    await ctx.replyWithMarkdown(welcomeMessage, 
      Markup.inlineKeyboard([
        [Markup.button.callback('📊 Статус розыгрыша', 'status')],
        [Markup.button.callback('🎯 Участвовать', 'join'), Markup.button.callback('💰 Баланс', 'balance')],
        [Markup.button.callback('🔍 Проверить честность', 'fairness')]
      ])
    );
  });

  // Status command
  bot.command('status', async (ctx) => {
    await showRaffleStatus(ctx, deps);
  });

  // Join command  
  bot.command('join', async (ctx) => {
    await handleJoinRaffle(ctx, deps);
  });

  // Fairness command
  bot.command('fairness', async (ctx) => {
    await showFairness(ctx, deps);
  });

  // Balance command
  bot.command('balance', async (ctx) => {
    try {
      const userId = BigInt(ctx.from!.id);
      const balance = await deps.walletProvider.getBalance(userId);
      await ctx.replyWithMarkdown(`💰 *Ваш баланс: ${balance} ⭐*\n\n_Это виртуальные звезды для демо-режима_`);
    } catch (error) {
      console.error('Error getting balance:', error);
      await ctx.reply('❌ Ошибка при получении баланса');
    }
  });

  // Stats command
  bot.command('stats', async (ctx) => {
    try {
      const userId = BigInt(ctx.from!.id);
      await showUserStats(ctx, deps, userId);
    } catch (error) {
      console.error('Error getting stats:', error);
      await ctx.reply('❌ Ошибка при получении статистики');
    }
  });

  // Help command
  bot.help((ctx) => {
    const helpText = `
🎰 *Telegram Stars Raffle Bot*

📋 *Команды:*
/start - Начать работу с ботом
/status - Текущее состояние розыгрыша  
/join - Участвовать в текущем розыгрыше
/balance - Проверить баланс виртуальных звезд
/stats - Ваша статистика участий
/fairness - Информация о честности и проверке
/help - Показать это сообщение

🔘 *Inline кнопки:*
Используйте кнопки в сообщениях для быстрого доступа к функциям.

❓ *Вопросы:*
Система полностью автоматизирована и справедлива. Все розыгрыши можно проверить криптографически.
`;
    ctx.replyWithMarkdown(helpText);
  });

  // Callback query handlers
  bot.action('status', async (ctx) => {
    await ctx.answerCbQuery();
    await showRaffleStatus(ctx, deps);
  });

  bot.action('join', async (ctx) => {
    await ctx.answerCbQuery();
    await handleJoinRaffle(ctx, deps);
  });

  bot.action('fairness', async (ctx) => {
    await ctx.answerCbQuery();
    await showFairness(ctx, deps);
  });

  bot.action('balance', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const userId = BigInt(ctx.from!.id);
      const balance = await deps.walletProvider.getBalance(userId);
      await ctx.replyWithMarkdown(`💰 *Ваш баланс: ${balance} ⭐*\n\n_Это виртуальные звезды для демо-режима_`);
    } catch (error) {
      console.error('Error getting balance:', error);
      await ctx.reply('❌ Ошибка при получении баланса');
    }
  });

  // Admin commands
  bot.command('admin_draw', async (ctx) => {
    const userId = ctx.from!.id.toString();
    if (userId !== config.adminUserId) {
      await ctx.reply('❌ У вас нет прав администратора');
      return;
    }

    try {
      const result = await deps.drawRaffleUseCase.execute();
      if (result.status === 'success') {
        await ctx.replyWithMarkdown(`✅ *Розыгрыш завершен!*

🏆 *Победитель:* User ${result.winnerUserId}
🎯 *Индекс:* ${result.winnerIndex} из ${result.participantsCount}
💰 *Участников:* ${result.participantsCount}

🔍 *Fairness proof:*
Seed: \`${result.seed.substring(0, 16)}...\`
Version: ${result.fairnessVersion}`);
      } else {
        let errorMsg = `❌ Не удалось провести розыгрыш: ${result.status}`;
        if ('message' in result && result.message) {
          errorMsg += `\n${result.message}`;
        }
        await ctx.reply(errorMsg);
      }
    } catch (error) {
      console.error('Admin draw error:', error);
      await ctx.reply('❌ Ошибка при проведении розыгрыша');
    }
  });

  bot.command('admin_status', async (ctx) => {
    const userId = ctx.from!.id.toString();
    if (userId !== config.adminUserId) {
      await ctx.reply('❌ У вас нет прав администратора');
      return;
    }

    try {
      const raffle = await deps.raffleRepository.findActiveRaffle();
      if (!raffle) {
        await ctx.reply('📭 Нет активного розыгрыша');
        return;
      }

      const r = raffle.toJSON();
      const statusText = `🔧 *Admin - Статус розыгрыша #${r.id}*

📊 *Основное:*
• Статус: ${r.status}
• Участников: ${r.totalEntries}/${r.threshold}
• Фонд: ${r.totalFund} ⭐
• Создан: ${r.createdAt.toLocaleString('ru')}

🔐 *Fairness:*
• Seed Hash: ${r.seedHash?.substring(0, 40) || 'не установлен'}...
• Grace: ${r.graceSeconds}s
${r.readyAt ? `• Ready с: ${r.readyAt.toLocaleString('ru')}` : ''}

⚙️ *Настройки:*
• Winner Share: ${r.winnerSharePercent}%
• Commission: ${r.commissionPercent}%
${r.forced ? '• Принудительный запуск: Да' : ''}`;

      await ctx.replyWithMarkdown(statusText);
    } catch (error) {
      console.error('Admin status error:', error);
      await ctx.reply('❌ Ошибка при получении статуса');
    }
  });

  // Error handling
  bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    if (ctx) {
      ctx.reply('❌ Произошла ошибка. Попробуйте позже.').catch(console.error);
    }
  });

  return bot;
}

async function showRaffleStatus(ctx: Context, deps: BotDependencies) {
  try {
    const raffle = await deps.raffleRepository.findActiveRaffle();
    
    if (!raffle) {
      await ctx.replyWithMarkdown(`📭 *Нет активного розыгрыша*

В данный момент активного розыгрыша нет. 
Следующий розыгрыш будет создан автоматически.`);
      return;
    }

    const r = raffle.toJSON();
    let statusText = '';
    
    switch (r.status) {
      case 'init':
      case 'collecting':
        statusText = `🎰 *Активный розыгрыш #${r.id}*

📊 *Статус:* Сбор участников
👥 *Участников:* ${r.totalEntries}
🎯 *Порог:* ${r.threshold}
💰 *Призовой фонд:* ${r.totalFund} звезд
💎 *Ставка:* ${r.entryCost} звезда

${r.totalEntries < r.threshold 
  ? `⏳ Нужно еще ${r.threshold - r.totalEntries} участников для запуска`
  : '🔥 Порог достигнут! Розыгрыш скоро начнется'
}`;
        break;
        
      case 'ready':
        const gracePeriod = r.readyAt ? new Date(r.readyAt.getTime() + r.graceSeconds * 1000) : null;
        statusText = `🎰 *Розыгрыш #${r.id} готов к проведению*

👥 *Участников:* ${r.totalEntries}
💰 *Призовой фонд:* ${r.totalFund} звезд
⏰ *Grace период до:* ${gracePeriod?.toLocaleString('ru') || 'неизвестно'}

🎲 Розыгрыш будет проведен автоматически после grace периода.`;
        break;
        
      case 'completed':
        statusText = `✅ *Розыгрыш #${r.id} завершен*

👥 *Участников:* ${r.totalEntries}
💰 *Призовой фонд:* ${r.totalFund} звезд
🏆 *Победитель:* User ${r.winnerUserId || 'неизвестен'}

🔍 Используйте /fairness для проверки честности розыгрыша.`;
        break;
        
      default:
        statusText = `📊 Розыгрыш #${r.id} в статусе: ${r.status}`;
    }

    const keyboard = [];
    if (r.status === 'collecting' || r.status === 'ready') {
      keyboard.push([Markup.button.callback('🎯 Участвовать', 'join')]);
    }
    keyboard.push([Markup.button.callback('🔍 Проверить честность', 'fairness')]);

    await ctx.replyWithMarkdown(statusText, Markup.inlineKeyboard(keyboard));
    
  } catch (error) {
    console.error('Error showing raffle status:', error);
    await ctx.reply('❌ Ошибка при получении статуса розыгрыша');
  }
}

async function handleJoinRaffle(ctx: Context, deps: BotDependencies) {
  try {
    const userId = BigInt(ctx.from!.id);
    const username = ctx.from!.username || ctx.from!.first_name;
    
    const result = await deps.joinRaffleUseCase.execute({
      userId,
      username,
      entryCost: 1 // Virtual stars
    });

    switch (result.status) {
      case 'success':
        await ctx.replyWithMarkdown(`✅ *Вы успешно присоединились к розыгрышу!*

🎰 Розыгрыш #${result.raffleId}
👤 Ваш номер участника: ${result.entrySequence}
👥 Всего участников: ${result.totalEntries}/${result.threshold}

${result.thresholdReached 
  ? '🔥 Порог достигнут! Розыгрыш скоро начнется.'
  : `⏳ Нужно еще ${result.threshold - result.totalEntries} участников.`
}`);
        break;
        
      case 'already_joined':
        await ctx.reply('ℹ️ Вы уже участвуете в этом розыгрыше!');
        break;
        
      case 'no_active_raffle':
        await ctx.reply('❌ Нет активного розыгрыша для участия');
        break;
        
      case 'insufficient_balance':
        await ctx.reply('❌ Недостаточно средств для участия. Нужна 1 виртуальная звезда.');
        break;
        
      default:
        await ctx.reply('❌ Не удалось присоединиться к розыгрышу. Попробуйте позже.');
    }
    
  } catch (error) {
    console.error('Error joining raffle:', error);
    await ctx.reply('❌ Ошибка при присоединении к розыгрышу');
  }
}

async function showFairness(ctx: Context, deps: BotDependencies) {
  const fairnessText = `🔍 *Система честности*

Наша система использует криптографические методы для гарантии честности:

🔐 *Принцип работы:*
1. При достижении порога генерируется случайный seed
2. Публикуется hash(seed) - невозможно подделать
3. После grace периода seed раскрывается
4. Победитель определяется детерминированно из seed + список участников

✅ *Проверяемость:*
• Любой может проверить честность после розыгрыша
• Используется SHA256 для всех хешей
• Алгоритм полностью открыт и предсказуем

📖 *Подробности:*
Полная документация по адресу: github.com/VictorFortuna/Telegram_Stars_Raffle_v4.0

🔢 *Текущая версия алгоритма:* v0b`;

  await ctx.replyWithMarkdown(fairnessText);
}

async function showUserStats(ctx: Context, deps: BotDependencies, userId: bigint) {
  // For MVP, we'll show basic stats. In the future, this could come from a dedicated UserRepository
  try {
    const balance = await deps.walletProvider.getBalance(userId);
    
    const statsText = `📊 *Ваша статистика*

💰 *Текущий баланс:* ${balance} ⭐

_В будущих версиях здесь будет:_
• Общее количество участий
• Количество выигрышей  
• Сумма выигрышей
• Процент успешности

🔮 *История участий*
_Функция находится в разработке_`;

    await ctx.replyWithMarkdown(statsText);
  } catch (error) {
    console.error('Error showing user stats:', error);
    await ctx.reply('❌ Ошибка при получении статистики');
  }
}
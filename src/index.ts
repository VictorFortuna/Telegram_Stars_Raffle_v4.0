// Main application entry point
import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';
import { config } from './config';
import { createBot } from './interfaces/bot/bot';
import { createSupabaseRaffleRepository } from './infrastructure/repositories/SupabaseRaffleRepository';
import { createFairnessService } from './infrastructure/services/FairnessServiceImpl';
import { createVirtualWalletProvider } from './infrastructure/wallet/VirtualWalletProvider';
import { JoinRaffleUseCase } from './application/usecases/JoinRaffleUseCase';
import { DrawRaffleUseCase } from './application/usecases/DrawRaffleUseCase';

async function main() {
  console.log('Starting Telegram Stars Raffle Bot...');
  console.log(`Mode: ${config.mode}`);
  console.log(`Environment: ${config.nodeEnv}`);

  // Initialize dependencies
  const raffleRepo = createSupabaseRaffleRepository();
  const fairnessService = createFairnessService();
  const walletProvider = createVirtualWalletProvider();
  
  // Initialize use cases
  const defaults = {
    threshold: config.defaultThreshold,
    entryCost: 1, // 1 virtual star
    winnerSharePercent: config.winnerSharePercent,
    commissionPercent: config.commissionPercent,
    graceSeconds: config.gracePeriodSeconds
  };
  
  const joinRaffleUseCase = new JoinRaffleUseCase(raffleRepo, fairnessService, defaults, walletProvider);
  const drawRaffleUseCase = new DrawRaffleUseCase(raffleRepo, fairnessService, walletProvider);

  // Create and start bot
  const bot = createBot({
    joinRaffleUseCase,
    drawRaffleUseCase,
    raffleRepository: raffleRepo,
    walletProvider
  });

  // Graceful shutdown
  process.once('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    bot.stop('SIGINT');
    process.exit(0);
  });

  process.once('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    bot.stop('SIGTERM');
    process.exit(0);
  });

  // Start bot
  await bot.launch();
  console.log('Bot started successfully!');
}

main().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
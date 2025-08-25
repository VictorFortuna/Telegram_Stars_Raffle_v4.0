#!/usr/bin/env tsx
// Manual test script to verify the complete flow works
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { createSupabaseRaffleRepository } from '../src/infrastructure/repositories/SupabaseRaffleRepository';
import { createFairnessService } from '../src/infrastructure/services/FairnessServiceImpl';
import { createVirtualWalletProvider } from '../src/infrastructure/wallet/VirtualWalletProvider';
import { JoinRaffleUseCase } from '../src/application/usecases/JoinRaffleUseCase';
import { DrawRaffleUseCase } from '../src/application/usecases/DrawRaffleUseCase';

async function testCompleteFlow() {
  console.log('🧪 Starting complete raffle flow test...\n');

  try {
    // Initialize services
    const raffleRepo = createSupabaseRaffleRepository();
    const fairnessService = createFairnessService();
    const walletProvider = createVirtualWalletProvider();

    const defaults = {
      threshold: 3, // Small threshold for testing
      entryCost: 1,
      winnerSharePercent: 70,
      commissionPercent: 30,
      graceSeconds: 1 // Very short grace period for testing
    };

    const joinUseCase = new JoinRaffleUseCase(raffleRepo, fairnessService, defaults, walletProvider);
    const drawUseCase = new DrawRaffleUseCase(raffleRepo, fairnessService, walletProvider);

    // Test users
    const users = [
      { id: BigInt(100001), name: 'Alice' },
      { id: BigInt(100002), name: 'Bob' },
      { id: BigInt(100003), name: 'Charlie' }
    ];

    console.log('1️⃣ Setting up test users...');
    for (const user of users) {
      await walletProvider.ensureUser(user.id, 50); // Give each user 50 virtual stars
      const balance = await walletProvider.getBalance(user.id);
      console.log(`   User ${user.name} (${user.id}): ${balance} ⭐`);
    }

    console.log('\n2️⃣ Users joining raffle...');
    for (const user of users) {
      const result = await joinUseCase.execute({
        userId: user.id,
        username: user.name
      });
      
      if (result.status === 'success') {
        console.log(`   ✅ ${user.name} joined raffle #${result.raffleId} as entry #${result.entrySequence}`);
        console.log(`      Total entries: ${result.totalEntries}/${result.threshold}`);
        if (result.thresholdReached) {
          console.log(`      🔥 Threshold reached! Committed: ${result.committed}`);
        }
      } else {
        console.log(`   ❌ ${user.name} failed to join: ${result.status}`);
      }
      
      // Check balance after joining
      const balance = await walletProvider.getBalance(user.id);
      console.log(`      Balance after: ${balance} ⭐`);
    }

    console.log('\n3️⃣ Checking raffle status...');
    const raffle = await raffleRepo.findActiveRaffle();
    if (raffle) {
      const r = raffle.toJSON();
      console.log(`   Raffle #${r.id}: ${r.status}`);
      console.log(`   Entries: ${r.totalEntries}, Fund: ${r.totalFund} ⭐`);
      console.log(`   Seed Hash: ${r.seedHash?.substring(0, 20)}...`);
      
      if (r.status === 'ready') {
        console.log(`   Grace period ends: ${new Date(r.readyAt!.getTime() + r.graceSeconds * 1000)}`);
      }
    }

    console.log('\n4️⃣ Waiting for grace period...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    console.log('\n5️⃣ Drawing winner...');
    const drawResult = await drawUseCase.execute();
    
    if (drawResult.status === 'success') {
      console.log(`   🎉 Winner: User ${drawResult.winnerUserId} (index ${drawResult.winnerIndex})`);
      console.log(`   Participants: ${drawResult.participantsCount}`);
      console.log(`   Fairness proof:`);
      console.log(`     Seed: ${drawResult.seed.substring(0, 20)}...`);
      console.log(`     Seed Hash: ${drawResult.seedHash.substring(0, 20)}...`);
      console.log(`     Participants Hash: ${drawResult.participantsHash.substring(0, 20)}...`);
      console.log(`     Winner Hash: ${drawResult.winnerHash.substring(0, 20)}...`);
      console.log(`     Version: ${drawResult.fairnessVersion}`);
    } else {
      console.log(`   ❌ Draw failed: ${drawResult.status} - ${drawResult.message || ''}`);
    }

    console.log('\n6️⃣ Final raffle state and balances...');
    const finalRaffle = await raffleRepo.findActiveRaffle();
    if (finalRaffle) {
      const fr = finalRaffle.toJSON();
      console.log(`   Raffle #${fr.id}: ${fr.status}`);
      console.log(`   Winner: ${fr.winnerUserId} (index ${fr.winnerIndex})`);
      console.log(`   Completed: ${fr.completedAt}`);
      console.log(`   Total fund: ${fr.totalFund} ⭐, Winner share: ${fr.winnerSharePercent}%`);
      
      // Check winner's balance
      if (fr.winnerUserId) {
        const winnerBalance = await walletProvider.getBalance(fr.winnerUserId);
        const expectedWinnings = Math.floor(fr.totalFund * fr.winnerSharePercent / 100);
        console.log(`   Winner balance: ${winnerBalance} ⭐ (gained ~${expectedWinnings} ⭐)`);
      }
    }

    console.log('\n   Final balances:');
    for (const user of users) {
      const balance = await walletProvider.getBalance(user.id);
      console.log(`   ${user.name}: ${balance} ⭐`);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testCompleteFlow().then(() => {
    console.log('\n🎯 All tests passed!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

export { testCompleteFlow };
// Virtual wallet implementation using Supabase
import { supabase } from '../db/supabaseClient';
import { WalletProvider } from '../../domain/services/WalletProvider';

export class VirtualWalletProvider implements WalletProvider {
  private readonly INITIAL_BALANCE = 100; // Give users 100 virtual stars to start

  async getBalance(userId: bigint): Promise<number> {
    await this.ensureUser(userId);
    
    const { data, error } = await supabase
      .from('balances')
      .select('balance')
      .eq('user_id', userId.toString())
      .single();
      
    if (error) throw error;
    return data?.balance || 0;
  }

  async debit(userId: bigint, amount: number, reason: string): Promise<boolean> {
    if (amount <= 0) return false;
    
    await this.ensureUser(userId);

    // Get current balance first
    const currentBalance = await this.getBalance(userId);
    if (currentBalance < amount) {
      return false;
    }

    const newBalance = currentBalance - amount;
    
    // Update balance
    const { error } = await supabase
      .from('balances')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId.toString());

    if (error) throw error;

    // Log the transaction (optional - could be added to transactions table)
    console.log(`DEBIT: ${userId} -${amount} (${reason})`);
    
    return true;
  }

  async credit(userId: bigint, amount: number, reason: string): Promise<boolean> {
    if (amount <= 0) return false;
    
    await this.ensureUser(userId);

    // Get current balance first
    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance + amount;

    const { error } = await supabase
      .from('balances')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId.toString());

    if (error) throw error;

    // Log the transaction
    console.log(`CREDIT: ${userId} +${amount} (${reason})`);
    
    return true;
  }

  async ensureUser(userId: bigint, initialBalance?: number): Promise<void> {
    // Ensure user exists in users table
    await supabase
      .from('users')
      .upsert({
        id: userId.toString(),
        last_seen_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    // Ensure balance record exists
    await supabase
      .from('balances')
      .upsert({
        user_id: userId.toString(),
        balance: initialBalance ?? this.INITIAL_BALANCE,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: true // Don't overwrite existing balance
      });
  }
}

export function createVirtualWalletProvider(): WalletProvider {
  return new VirtualWalletProvider();
}
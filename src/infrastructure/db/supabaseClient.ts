import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Используем service_role на сервере, иначе fallback на anon
const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const keyToUse = serviceKey || anonKey;

export const supabase = createClient(url, keyToUse, {
  auth: { persistSession: false }
});

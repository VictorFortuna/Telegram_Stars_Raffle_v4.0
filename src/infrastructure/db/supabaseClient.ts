// supabaseClient.ts (Draft)
// Предполагаем, что в дальнейшем добавим проверку наличия ключей.
// Пока только экспорт клиента для service-role (серверные операции).

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceKey) {
  console.warn('[supabaseClient] Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set (repository methods may fail)');
}

// Тип any для простоты сейчас. Позже добавим generics для схемы.
export const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});
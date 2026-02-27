import { createClient } from '@supabase/supabase-js';

// service role key needs to be kept secret on server
const supabaseUrl = process.env.VITE_REACT_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase admin client requires VITE_REACT_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
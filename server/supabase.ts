import { createClient } from '@supabase/supabase-js';

// Server-side supabase client using process.env (NOT import.meta.env which is Vite-only)
const supabaseUrl = process.env.VITE_REACT_SUPABASE_URL || 'https://fkinstgdeoyzaazauwdf.supabase.co';
const supabaseAnonKey = process.env.VITE_REACT_SUPABASE_ANON_KEY || 'sb_publishable_KofSV5lMFsunN-J-Az8_SQ_JyM3H6bD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

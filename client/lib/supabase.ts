import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_REACT_SUPABASE_URL as string)) ||
	(typeof process !== 'undefined' && process.env.VITE_REACT_SUPABASE_URL) ||
	'https://fkinstgdeoyzaazauwdf.supabase.co';

const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_REACT_SUPABASE_ANON_KEY as string)) ||
	(typeof process !== 'undefined' && process.env.VITE_REACT_SUPABASE_ANON_KEY) ||
	'sb_publishable_KofSV5lMFsunN-J-Az8_SQ_JyM3H6bD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
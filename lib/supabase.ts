
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gkeefpikeelluidtutqn.supabase.co';
const supabaseKey = 'sb_publishable_wibJjMiaTQilySFtEYvGYQ_lLUqWf-a';

export const supabase = createClient(supabaseUrl, supabaseKey);

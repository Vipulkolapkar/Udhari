import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://llpnngauiqznoegdlqpv.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxscG5uZ2F1aXF6bm9lZ2RscXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDQ5NzEsImV4cCI6MjEwMjk4MDk3MX0.QROlk3Beq_S57KfcruritC3ukxIwdmi7btt9DXFk_4M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

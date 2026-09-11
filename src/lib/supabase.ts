import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://dwphczucsxfekbulbnpv.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3cGhjenVjc3hmZWtidWxibnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNDQ1MTksImV4cCI6MjEwMzgyMDUxOX0.Fn1a3hk0upjIrG2CJPNKYmeCM4gPBnKSA4HcthUGHYA';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


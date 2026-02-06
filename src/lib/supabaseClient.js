import { createClient } from '@supabase/supabase-js';

// Dapat may quotes sa simula at dulo ng value
const supabaseUrl = 'https://bubpjcmcvjntrtaycuvw.supabase.co';
const supabaseAnonKey = 'sb_publishable_Vs7GWYfU0kBFPoBOSJUd0A_T5hS3UTb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js';

// قراءة الرابط والمفتاح العام من ملف .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// إنشاء وتصدير أداة الاتصال بقاعدة البيانات
export const supabase = createClient(supabaseUrl, supabaseKey);
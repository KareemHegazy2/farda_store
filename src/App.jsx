import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Catalog from './Catalog';
import Admin from './Admin';
import Login from './Login';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // التحقق من طلب الدخول للوحة التحكم
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminPath(true);
    }

    // التحقق من وجود جلسة دخول نشطة ومحفوظة مسبقاً
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
    });

    // متابعة أي تغيير في حالة تسجيل الدخول / الخروج لحظياً
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checkingAuth) {
    return null; // شاشة تحميل لحظية حتى التأكد من الجلسة
  }

  // إذا طلب مسار الآدمن:
  if (isAdminPath) {
    // مسجل دخول مسبقاً؟ يفتح الداشبورد
    if (session) {
      return <Admin />;
    }
    // غير مسجل دخول؟ يعرض شاشة Login فقط
    return <Login onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  // الزائر العادي يرى الكتالوج فقط دون أي أثر للوحة التحكم
  return <Catalog />;
}
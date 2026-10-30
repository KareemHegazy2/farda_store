import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.');
    } else if (data.session) {
      onLoginSuccess(data.session);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f4f5',
      direction: 'rtl',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <form onSubmit={handleLogin} style={{
        background: '#fff',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <h2 style={{ margin: 0, textAlign: 'center', color: '#111' }}>تسجيل دخول الإدارة</h2>
        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
          خاص بإدارة براند فردا فقط
        </p>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <label style={{ fontSize: '0.9rem', color: '#333' }}>
          البريد الإلكتروني / اسم المستخدم:
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@farda.com"
            style={{ width: '100%', padding: '10px', marginTop: '6px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </label>

        <label style={{ fontSize: '0.9rem', color: '#333' }}>
          كلمة المرور:
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: '100%', padding: '10px', marginTop: '6px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ccc' }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '10px',
            padding: '12px',
            background: '#111',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {loading ? 'جاري التحقق...' : 'دخول'}
        </button>

        <a href="/" style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666', textDecoration: 'none', marginTop: '6px' }}>
          الرجوع إلى المتجر
        </a>
      </form>
    </div>
  );
}
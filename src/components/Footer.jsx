export default function Footer() {
  return (
    <footer style={{ background: '#111', color: '#888', padding: '2rem 1rem', textAlign: 'center', marginTop: 'auto', borderTop: '1px solid #222' }}>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()} FARDA
      </p>
    </footer>
  );
}
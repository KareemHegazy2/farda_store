export default function ProductCard({ product, onOrder }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #eee',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)';
      }}
    >
      <div
        style={{
          width: '100%',
          height: '300px',
          background: '#f8f8f8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        <img
          src={product.image_url}
          alt={product.name}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
            margin: 'auto',
          }}
        />
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1a1a1a', fontWeight: '700' }}>{product.name}</h3>

        {product.material && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.5' }}>
            الخامة: {product.material}
          </p>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111' }}>
            {product.price} <span style={{ fontSize: '0.85rem', fontWeight: '400', color: '#666' }}>ج.م</span>
          </span>

          <button
            onClick={() => onOrder(product)}
            style={{
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#25D366'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#111'}
          >
            طلب عبر واتساب
          </button>
        </div>
      </div>
    </div>
  );
}
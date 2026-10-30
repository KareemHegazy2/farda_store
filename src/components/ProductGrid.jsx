import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, onOrder }) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem 0', color: '#666' }}>جاري تحميل المنتجات...</div>;
  }

  if (products.length === 0) {
    return <div style={{ textAlign: 'center', padding: '5rem 0', color: '#888' }}>لا توجد منتجات معروضة حالياً.</div>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '2.5rem',
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onOrder={onOrder} />
      ))}
    </div>
  );
}
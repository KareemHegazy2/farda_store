import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import ProductGrid from './components/ProductGrid';
import Footer from './components/Footer';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // استبدل الرقم برقم واتساب المتجر الدولي
  const WHATSAPP_NUMBER = '201000000000';

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('فشل جلب المنتجات:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const handleOrder = (product) => {
    const message = encodeURIComponent(
      `مساء الخير، حابب أطلب من براند فردا:\n- المنتج: ${product.name}\n- السعر: ${product.price} ج.م\n- الخامة: ${product.material || 'قطن مصري'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fcfcfc', direction: 'rtl', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header />
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '3rem 1.5rem', boxSizing: 'border-box' }}>
        <ProductGrid products={products} loading={loading} onOrder={handleOrder} />
      </main>
      <Footer />
    </div>
  );
}
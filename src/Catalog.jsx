import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';

const COLOR_MAP = {
  'أسود': '#111111', 'أبيض': '#ffffff', 'رمادي': '#9ca3af',
  'كحلي': '#1e293b', 'أزرق': '#3b82f6', 'أحمر': '#ef4444',
  'أخضر': '#22c55e', 'بيج': '#e5e5cb', 'بني': '#78350f',
  'أصفر': '#eab308'
};

function parseColorsList(rawColors) {
  if (!rawColors) return [];
  let list = rawColors;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } 
    catch { list = list.split(',').map(s => s.trim()).filter(Boolean); }
  }
  if (!Array.isArray(list)) return [];

  return list.map(item => {
    let parsed = item;
    if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('"'))) {
      try { parsed = JSON.parse(parsed); } catch {}
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const name = String(parsed.name || '').trim();
      return { name: name || 'لون', hex: parsed.hex || COLOR_MAP[name] || '#111111' };
    }
    if (typeof parsed === 'string') {
      return { name: parsed, hex: COLOR_MAP[parsed] || '#cccccc' };
    }
    return null;
  }).filter(Boolean);
}

function ProductCard({ product, now, onOpenModal }) {
  const images = Array.isArray(product?.images) && product.images.length > 0 
    ? product.images 
    : product?.image_url ? [product.image_url] : [];
    
  const colors = parseColorsList(product?.colors);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colors[0]?.name || '');

  const basePrice = Number(product?.price || 0);
  const discPrice = product?.discount_price ? Number(product.discount_price) : null;
  const discountEndMs = product?.discount_until ? new Date(product.discount_until).getTime() : 0;
  
  const isDiscountValid = discPrice !== null && discPrice > 0 && discPrice < basePrice && discountEndMs > now;
  const finalPrice = isDiscountValid ? discPrice : basePrice;
  const isSoldOut = product?.is_out_of_stock;

  return (
    <div className="col">
      <div
        className="card h-100 border-0 rounded-4"
        onClick={() => onOpenModal({ ...product, finalPrice, selectedColor, images, colors, activeImageIdx })}
        style={{ 
          cursor: 'pointer', 
          transition: 'transform 0.2s, box-shadow 0.2s',
          backgroundColor: '#1e293b', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.boxShadow = '0 12px 25px rgba(6, 182, 212, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        }}
      >
        <div className="rounded-top-4 d-flex align-items-center justify-content-center position-relative" style={{ height: '260px', padding: '15px', backgroundColor: '#0f172a' }}>
          {isSoldOut && (
            <div className="position-absolute top-50 start-50 translate-middle badge bg-danger fs-5 px-4 py-2 shadow" style={{ zIndex: 2, opacity: 0.9 }}>
              نفدت الكمية
            </div>
          )}
          <img
            src={images[activeImageIdx] || images[0]}
            alt={product?.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: isSoldOut ? 'grayscale(100%) opacity(0.6)' : 'none' }}
          />
        </div>

        <div className="card-body d-flex flex-column p-4 text-light">
          {images.length > 1 && (
            <div 
              className="d-flex gap-2 justify-content-center mb-3 overflow-auto" 
              onClick={(e) => e.stopPropagation()} 
            >
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`btn p-1 rounded-3 ${activeImageIdx === idx ? 'border-info border-2' : 'border-secondary'}`}
                  style={{ width: '45px', height: '45px', backgroundColor: '#334155' }}
                >
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}

          <h5 className="card-title fw-bold text-white mb-1">{product?.name}</h5>
          {product?.material && <p className="card-text text-info small mb-3">{product.material}</p>}

          {colors.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
              {colors.map((c, idx) => {
                const isSelected = selectedColor === c.name;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(c.name)}
                    disabled={isSoldOut}
                    className={`btn btn-sm rounded-pill d-flex align-items-center gap-2 ${isSelected ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-light'}`}
                    style={{ fontSize: '0.8rem', padding: '4px 10px', opacity: isSoldOut ? 0.5 : 1 }}
                  >
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-3 border-top border-secondary d-flex justify-content-between align-items-center">
            <div className="d-flex flex-column">
              {isDiscountValid && !isSoldOut && <span className="text-secondary text-decoration-line-through" style={{ fontSize: '0.85rem' }}>{basePrice} ج.م</span>}
              <span className={`fw-bold fs-4 ${isDiscountValid && !isSoldOut ? 'text-danger' : 'text-white'} ${isSoldOut ? 'text-muted' : ''}`}>
                {finalPrice} <span className="fs-6 text-secondary fw-normal">ج.م</span>
              </span>
            </div>
            <span className="badge text-dark rounded-pill px-3 py-2 fs-6 shadow-sm" style={{ backgroundColor: '#06b6d4' }}>عرض ⤢</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [selectedProduct, setSelectedProduct] = useState(null);

  const WHATSAPP_NUMBER = '201000000000';

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
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
    if (product.is_out_of_stock) return;
    const colorLine = product.selectedColor ? `\n- اللون: ${product.selectedColor}` : '';
    const message = encodeURIComponent(
      `مساء الخير، حابب أطلب من براند فردا:\n- المنتج: ${product.name}${colorLine}\n- السعر: ${product.finalPrice} ج.م\n- الخامة: ${product.material || 'قطن مصري'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', direction: 'rtl', fontFamily: 'system-ui, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      
      <header className="py-3 text-center shadow-sm d-flex justify-content-center align-items-center gap-3" style={{ backgroundColor: '#1e293b', borderBottom: '2px solid #06b6d4' }}>
        <img src="/favicon.png" alt="Farda Logo" style={{ height: '45px', objectFit: 'contain' }} />
        <h1 className="m-0 fw-bold text-white" style={{ letterSpacing: '3px', fontSize: '1.8rem' }}>FARDA</h1>
      </header>

      <main className="container py-5 flex-grow-1">
        {loading ? (
          <div className="text-center py-5 text-info fw-bold fs-4">جاري تحميل التشكيلة...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-5 text-secondary fs-4">لا توجد منتجات معروضة حالياً.</div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} now={now} onOpenModal={setSelectedProduct} />
            ))}
          </div>
        )}
      </main>

      <footer className="mt-auto py-4 text-center border-top border-secondary" style={{ backgroundColor: '#1e293b' }}>
        <div className="container d-flex flex-column align-items-center gap-3">
          <h4 className="m-0 fw-bold text-info" style={{ letterSpacing: '2px' }}>FARDA STORE</h4>
          <p className="text-secondary small m-0">تابعونا لمعرفة أحدث الموديلات والعروض الحصرية</p>
          
          <div className="d-flex gap-3 mt-2">
            <a href="https://www.instagram.com/farda_store11?exln=bmE3b242aXh5NXZl" target="_blank" rel="noopener noreferrer" className="btn btn-outline-info rounded-pill btn-sm px-4 fw-bold">Instagram</a>
            <a href="https://www.facebook.com/share/1FGcrSsst8/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="btn btn-outline-info rounded-pill btn-sm px-4 fw-bold">Facebook</a>
            <a href="https://www.tiktok.com/@farda_store11?_r=1&_t=ZS-9B2uEGYoRyG" target="_blank" rel="noopener noreferrer" className="btn btn-outline-info rounded-pill btn-sm px-4 fw-bold">TikTok</a>
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <div
          id="modal-overlay"
          onClick={(e) => e.target.id === 'modal-overlay' && setSelectedProduct(null)}
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1050, padding: '1rem' }}
        >
          <div className="rounded-4 shadow-lg position-relative overflow-hidden flex-column flex-md-row d-flex border border-secondary" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', backgroundColor: '#1e293b' }}>
            
            <button
              onClick={() => setSelectedProduct(null)}
              className="btn btn-info position-absolute rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{ top: '15px', right: '15px', width: '38px', height: '38px', zIndex: 10, fontSize: '1.2rem', color: '#0f172a' }}
            >✕</button>

            <div className="d-flex flex-column align-items-center justify-content-center p-4" style={{ flex: '1 1 50%', backgroundColor: '#0f172a', position: 'relative' }}>
               {selectedProduct.is_out_of_stock && (
                <div className="position-absolute badge bg-danger fs-5 px-4 py-2 shadow" style={{ zIndex: 2, top: '20px', left: '20px' }}>
                  نفدت الكمية
                </div>
              )}
              <img
                src={selectedProduct.images[selectedProduct.activeImageIdx] || selectedProduct.images[0]}
                alt={selectedProduct.name}
                style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', filter: selectedProduct.is_out_of_stock ? 'grayscale(100%) opacity(0.6)' : 'none' }}
              />
              {selectedProduct.images.length > 1 && (
                <div className="d-flex gap-2 mt-4 overflow-auto px-2">
                  {selectedProduct.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedProduct({ ...selectedProduct, activeImageIdx: idx })}
                      className={`btn p-1 rounded-3 ${selectedProduct.activeImageIdx === idx ? 'border-info border-2' : 'border-secondary'}`}
                      style={{ width: '55px', height: '55px', backgroundColor: '#334155' }}
                    >
                      <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 d-flex flex-column justify-content-center text-light" style={{ flex: '1 1 50%', overflowY: 'auto' }}>
              <h2 className="fw-bold text-white mb-2">{selectedProduct.name}</h2>
              <div className="fs-3 fw-bold mb-4" style={{ color: '#06b6d4' }}>
                {selectedProduct.finalPrice} <span className="fs-6 text-secondary">ج.م</span>
              </div>

              {selectedProduct.material && (
                <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: '#334155' }}>
                  <h6 className="fw-bold text-info">الخامة والتفاصيل:</h6>
                  <p className="text-light mb-0 small">{selectedProduct.material}</p>
                </div>
              )}

              {selectedProduct.colors.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-bold text-info mb-3">اللون المحدد: <span className="text-white">{selectedProduct.selectedColor}</span></h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {selectedProduct.colors.map((c, idx) => {
                      const isSelected = selectedProduct.selectedColor === c.name;
                      return (
                        <button
                          key={idx}
                          disabled={selectedProduct.is_out_of_stock}
                          onClick={() => setSelectedProduct({ ...selectedProduct, selectedColor: c.name })}
                          className={`btn rounded-pill d-flex align-items-center gap-2 ${isSelected ? 'btn-info text-dark fw-bold' : 'btn-outline-secondary text-light'}`}
                          style={{ padding: '6px 14px', opacity: selectedProduct.is_out_of_stock ? 0.5 : 1 }}
                        >
                          <span style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: c.hex, border: '1px solid rgba(255,255,255,0.3)' }} />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleOrder(selectedProduct)}
                disabled={selectedProduct.is_out_of_stock}
                className={`btn btn-lg w-100 rounded-pill fw-bold shadow mt-auto ${selectedProduct.is_out_of_stock ? 'btn-secondary' : 'btn-info text-dark'}`}
                style={{ transition: 'transform 0.2s' }}
                onMouseEnter={(e) => {
                  if(!selectedProduct.is_out_of_stock) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                   if(!selectedProduct.is_out_of_stock) e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {selectedProduct.is_out_of_stock ? 'نفدت الكمية' : 'تأكيد الطلب عبر واتساب'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
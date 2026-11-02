import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';

const PRESET_COLORS = [
  { name: 'أسود', hex: '#111111' },
  { name: 'أبيض', hex: '#ffffff' },
  { name: 'رمادي', hex: '#808080' },
  { name: 'كحلي', hex: '#1e293b' },
  { name: 'بيج', hex: '#d6ccc2' },
  { name: 'نبيتي', hex: '#7f1d1d' },
  { name: 'أزرق', hex: '#2563eb' },
  { name: 'أخضر', hex: '#16a34a' },
  { name: 'بني', hex: '#78350f' },
  { name: 'أصفر', hex: '#eab308' },
];

const COLOR_MAP = Object.fromEntries(PRESET_COLORS.map((c) => [c.name, c.hex]));

function parseColorsList(rawColors) {
  if (!rawColors) return [];
  let list = rawColors;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = list.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      let parsed = item;
      if (typeof parsed === 'string' && (parsed.trim().startsWith('{') || parsed.trim().startsWith('"'))) {
        try {
          parsed = JSON.parse(parsed.trim());
          if (typeof parsed === 'string' && parsed.startsWith('{')) parsed = JSON.parse(parsed);
        } catch {}
      }
      if (typeof parsed === 'object' && parsed !== null) {
        const cleanName = String(parsed.name || parsed.colorName || '').trim();
        let hex = parsed.hex || parsed.color || '';
        if ((!hex || hex === '#111111') && COLOR_MAP[cleanName] && cleanName !== 'أسود') {
          hex = COLOR_MAP[cleanName];
        }
        return { name: cleanName || hex || 'لون', hex: hex || COLOR_MAP[cleanName] || '#111111' };
      }
      if (typeof parsed === 'string' && parsed.trim()) {
        const str = parsed.trim();
        return { name: str, hex: COLOR_MAP[str] || (str.startsWith('#') ? str : '#cccccc') };
      }
      return null;
    })
    .filter(Boolean);
}

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [material, setMaterial] = useState('');
  const [isOutOfStock, setIsOutOfStock] = useState(false);

  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [colors, setColors] = useState([]);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#2563eb');

  const [discountPrice, setDiscountPrice] = useState('');
  const [discountUntil, setDiscountUntil] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const signOutAdmin = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const uploadSingleImage = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_PRESET;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'تعذر رفع الصورة');
    return result.secure_url;
  };

  const handleColorNameChange = (val) => {
    setColorName(val);
    const trimmed = val.trim();
    if (COLOR_MAP[trimmed]) {
      setColorHex(COLOR_MAP[trimmed]);
    }
  };

  const togglePresetColor = (preset) => {
    const exists = colors.some((c) => c.name === preset.name);
    if (exists) {
      setColors(colors.filter((c) => c.name !== preset.name));
    } else {
      setColors([...colors, { name: preset.name, hex: preset.hex }]);
    }
  };

  const handleAddCustomColor = () => {
    const trimmed = colorName.trim();
    if (!trimmed) return;
    const finalHex = COLOR_MAP[trimmed] || colorHex;
    if (!colors.some((c) => c.name === trimmed)) {
      setColors([...colors, { name: trimmed, hex: finalHex }]);
    }
    setColorName('');
  };

  const handleRemoveColor = (indexToRemove) => {
    setColors(colors.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveExistingImage = (urlToRemove) => {
    setExistingImages(existingImages.filter((url) => url !== urlToRemove));
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setMaterial('');
    setIsOutOfStock(false);
    setImageFiles([]);
    setExistingImages([]);
    setColors([]);
    setColorName('');
    setColorHex('#2563eb');
    setDiscountPrice('');
    setDiscountUntil('');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedUrls = [];
      if (imageFiles.length > 0) {
        uploadedUrls = await Promise.all(
          Array.from(imageFiles).map((file) => uploadSingleImage(file))
        );
      }

      const finalImages = [...existingImages, ...uploadedUrls];
      if (finalImages.length === 0) {
        throw new Error('يرجى إضافة صورة واحدة على الأقل للمنتج');
      }

      let finalColors = [...colors];
      if (colorName.trim()) {
        const trimmed = colorName.trim();
        if (!finalColors.some((c) => c.name === trimmed)) {
          finalColors.push({
            name: trimmed,
            hex: COLOR_MAP[trimmed] || colorHex,
          });
        }
      }

      const payload = {
        name,
        price: Number(price),
        material,
        image_url: finalImages[0],
        images: finalImages,
        colors: finalColors,
        discount_price: discountPrice ? Number(discountPrice) : null,
        discount_until: discountUntil ? new Date(discountUntil).toISOString() : null,
        is_out_of_stock: isOutOfStock,
      };

      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([payload]);
        if (error) throw error;
      }

      resetForm();
      e.target.reset();
      await loadProducts();
      alert(editingId ? 'تم تحديث بيانات المنتج بنجاح!' : 'تمت إضافة المنتج بنجاح!');
    } catch (err) {
      alert('تنبيه: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEdit = (item) => {
    setEditingId(item.id);
    setName(item.name || '');
    setPrice(item.price || '');
    setMaterial(item.material || '');
    setIsOutOfStock(item.is_out_of_stock || false);

    const imgs =
      item.images && item.images.length > 0
        ? item.images
        : item.image_url
        ? [item.image_url]
        : [];
    setExistingImages(imgs);
    setImageFiles([]);

    setColors(parseColorsList(item.colors));
    setDiscountPrice(item.discount_price || '');

    if (item.discount_until) {
      const dt = new Date(item.discount_until);
      const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDiscountUntil(localIso);
    } else {
      setDiscountUntil('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveProduct = async (id) => {
    if (!window.confirm('هل تريد حذف هذا المنتج نهائياً؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) loadProducts();
  };

  return (
    <div className="container my-5" style={{ maxWidth: '1000px', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <h2 className="m-0 fw-bold text-dark">لوحة تحكم وإدارة "فردا"</h2>
        <div className="d-flex gap-2">
          <a href="/" className="btn btn-light fw-bold border">زيارة المتجر</a>
          <button onClick={signOutAdmin} className="btn btn-danger fw-bold">تسجيل خروج</button>
        </div>
      </div>

      <form onSubmit={handleSaveProduct} className="bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-5">
        <h4 className="fw-bold mb-4">{editingId ? 'تعديل المنتج المحدد' : 'إضافة منتج جديد للكتالوج'}</h4>

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-bold">اسم المنتج / الموديل</label>
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">السعر الأساسي (ج.م)</label>
            <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">الخامة (اختياري)</label>
            <input type="text" className="form-control" value={material} onChange={(e) => setMaterial(e.target.value)} />
          </div>
        </div>

        {/* حالة التوفر (Sold Out) */}
        <div className="form-check form-switch mb-4 p-3 rounded-3 border" style={{ backgroundColor: isOutOfStock ? '#fff5f5' : '#f8fafc' }}>
          <div className="d-flex align-items-center ms-4">
            <input
              className="form-check-input ms-3"
              type="checkbox"
              id="outOfStockSwitch"
              checked={isOutOfStock}
              onChange={(e) => setIsOutOfStock(e.target.checked)}
              style={{ cursor: 'pointer', transform: 'scale(1.3)' }}
            />
            <label className={`form-check-label fw-bold ${isOutOfStock ? 'text-danger' : 'text-dark'}`} htmlFor="outOfStockSwitch" style={{ cursor: 'pointer' }}>
              {isOutOfStock ? 'المنتج نفدت كميته (Sold Out) - مخفي من الطلب' : 'المنتج متوفر بالمخزون ومتاح للطلب'}
            </label>
          </div>
        </div>

        {/* قسم الخصومات */}
        <div className="bg-light p-3 rounded-3 border mb-4">
          <h6 className="fw-bold text-warning mb-3">إعدادات الخصم المؤقت (اختياري)</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small">السعر بعد الخصم (ج.م)</label>
              <input type="number" className="form-control" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label className="form-label small">تاريخ ووقت انتهاء الخصم</label>
              <input type="datetime-local" className="form-control" value={discountUntil} onChange={(e) => setDiscountUntil(e.target.value)} />
            </div>
          </div>
        </div>

        {/* الألوان */}
        <div className="bg-light p-3 rounded-3 border mb-4">
          <h6 className="fw-bold mb-3">الألوان المتاحة للمنتج</h6>
          <div className="d-flex gap-2 flex-wrap mb-3">
            {PRESET_COLORS.map((preset) => {
              const isSelected = colors.some((c) => c.name === preset.name);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => togglePresetColor(preset)}
                  className={`btn btn-sm rounded-pill d-flex align-items-center gap-2 ${isSelected ? 'btn-dark text-white' : 'btn-outline-secondary'}`}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: preset.hex, border: preset.hex === '#ffffff' ? '1px solid #ccc' : 'none' }} />
                  {preset.name} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          <div className="d-flex gap-2 align-items-center mb-3">
            <input type="text" className="form-control w-auto flex-grow-1" placeholder="لون مخصص..." value={colorName} onChange={(e) => handleColorNameChange(e.target.value)} />
            <input type="color" className="form-control form-control-color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
            <button type="button" onClick={handleAddCustomColor} className="btn btn-secondary">إضافة</button>
          </div>

          {colors.length > 0 && (
            <div className="d-flex gap-2 flex-wrap pt-3 border-top">
              {colors.map((c, idx) => (
                <span key={idx} className="badge bg-white text-dark border d-flex align-items-center gap-2 px-3 py-2 rounded-pill">
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.hex, border: '1px solid #ccc' }} />
                  {c.name}
                  <button type="button" onClick={() => handleRemoveColor(idx)} className="btn-close" style={{ fontSize: '0.5rem' }}></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* الصور */}
        <div className="bg-light p-3 rounded-3 border mb-4">
          <label className="form-label fw-bold">صور المنتج</label>
          <input type="file" className="form-control" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)} />
          {existingImages.length > 0 && (
            <div className="d-flex gap-2 flex-wrap mt-3">
              {existingImages.map((imgUrl, index) => (
                <div key={index} className="position-relative border rounded-3 overflow-hidden bg-white" style={{ width: '70px', height: '70px' }}>
                  <img src={imgUrl} alt="" className="w-100 h-100" style={{ objectFit: 'contain' }} />
                  <button type="button" onClick={() => handleRemoveExistingImage(imgUrl)} className="btn btn-danger btn-sm position-absolute top-0 start-0 m-1 rounded-circle p-0 d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', fontSize: '10px' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="d-flex gap-2">
          <button type="submit" disabled={loading} className="btn btn-primary flex-grow-1 py-2 fw-bold fs-5">
            {loading ? 'جاري المعالجة...' : editingId ? 'حفظ التعديلات' : 'نشر المنتج'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn btn-secondary py-2 fw-bold px-4">إلغاء</button>
          )}
        </div>
      </form>

      {/* جدول المنتجات */}
      <h4 className="fw-bold mb-3">المنتجات المسجلة ({products.length})</h4>
      <div className="table-responsive bg-white rounded-4 shadow-sm border">
        <table className="table table-hover align-middle m-0">
          <thead className="table-light">
            <tr>
              <th>الصور</th>
              <th>الاسم</th>
              <th>الحالة</th>
              <th>السعر الأساسي</th>
              <th>الألوان</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const allImgs = p.images?.length > 0 ? p.images : [p.image_url];
              const parsedColors = parseColorsList(p.colors);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="d-flex gap-1 align-items-center">
                      <img src={allImgs[0]} alt="" width="50" height="50" className="border rounded bg-light" style={{ objectFit: 'contain' }} />
                      {allImgs.length > 1 && <span className="badge bg-secondary">+{allImgs.length - 1}</span>}
                    </div>
                  </td>
                  <td className="fw-bold">{p.name}</td>
                  <td>
                    {p.is_out_of_stock ? <span className="badge bg-danger">نفدت الكمية</span> : <span className="badge bg-success">متوفر</span>}
                  </td>
                  <td>{p.price} ج.م</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      {parsedColors.length > 0 ? parsedColors.map((c, i) => (
                        <span key={i} title={c.name} style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: c.hex, border: '1px solid #ccc' }} />
                      )) : <span className="text-muted small">—</span>}
                    </div>
                  </td>
                  <td>
                    <button onClick={() => handleSelectEdit(p)} className="btn btn-sm btn-light border fw-bold me-2">تعديل</button>
                    <button onClick={() => handleRemoveProduct(p.id)} className="btn btn-sm btn-danger fw-bold">حذف</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [material, setMaterial] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const preset = import.meta.env.VITE_CLOUDINARY_PRESET;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'فشل رفع الصورة لـ Cloudinary');
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile);
      }

      if (editingId) {
        const updates = { name, price: Number(price), material };
        if (imageUrl) updates.image_url = imageUrl;

        const { error } = await supabase.from('products').update(updates).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        if (!imageUrl) throw new Error('يرجى اختيار صورة للمنتج أولاً');

        const { error } = await supabase.from('products').insert([
          { name, price: Number(price), material, image_url: imageUrl }
        ]);
        if (error) throw error;
      }

      setName('');
      setPrice('');
      setMaterial('');
      setImageFile(null);
      e.target.reset();
      fetchProducts();
      alert(editingId ? 'تم تعديل المنتج بنجاح!' : 'تمت إضافة الشراب بنجاح!');
    } catch (err) {
      alert('حدث خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price);
    setMaterial(p.material);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* شريط العنوان وأزرار التحكم والخروج */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111' }}>لوحة إدارة منتجات "فردا"</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/"
            style={{
              padding: '8px 14px',
              background: '#f0f0f0',
              color: '#111',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            عرض المتجر
          </a>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 14px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold'
            }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* نموذج الإضافة والتعديل */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>{editingId ? 'تعديل بيانات الشراب' : 'إضافة شراب جديد'}</h3>
        
        <input
          type="text"
          placeholder="اسم الشراب"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <input
          type="number"
          placeholder="السعر (ج.م)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <input
          type="text"
          placeholder="الخامة (مثلاً: 85% قطن مصري، 15% ليكرا)"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <label style={{ fontSize: '0.9rem', color: '#555' }}>
          صورة الشراب:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            style={{ display: 'block', marginTop: '6px' }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'جاري رفع الصورة وحفظ البيانات...' : editingId ? 'حفظ التعديلات' : 'إضافة المنتج إلى الكتالوج'}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={() => { setEditingId(null); setName(''); setPrice(''); setMaterial(''); }}
            style={{ padding: '8px', background: '#888', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            إلغاء التعديل
          </button>
        )}
      </form>

      {/* جدول المنتجات */}
      <h3>قائمة المنتجات الحالية ({products.length})</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
        <thead>
          <tr style={{ background: '#eee' }}>
            <th>الصورة</th>
            <th>الاسم</th>
            <th>السعر</th>
            <th>الخامة</th>
            <th>التحكم</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <img src={p.image_url} alt={p.name} width="50" height="50" style={{ objectFit: 'cover', borderRadius: '4px' }} />
              </td>
              <td>{p.name}</td>
              <td>{p.price} ج.م</td>
              <td>{p.material}</td>
              <td>
                <button onClick={() => startEdit(p)} style={{ marginLeft: '8px', cursor: 'pointer' }}>تعديل</button>
                <button onClick={() => handleDelete(p.id)} style={{ color: 'red', cursor: 'pointer' }}>حذف</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#777' }}>لا توجد منتجات مسجلة حتى الآن.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
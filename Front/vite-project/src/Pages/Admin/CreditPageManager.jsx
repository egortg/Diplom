import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import s from './CreditPageManager.module.scss';

const CreditPageManager = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('banner');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [banner, setBanner] = useState({
        title: '',
        description: '',
        button_text: '',
        button_link: '',
        image_url: '',
        is_active: true
    });
    const [benefits, setBenefits] = useState([]);
    const [form, setForm] = useState({
        title: '',
        button_text: '',
        fields: [],
        agreements: [],
        is_active: true
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const [bannerRes, benefitsRes, formRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/credit-banner', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/admin/credit-benefits', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/admin/credit-form', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setBanner(bannerRes.data);
            setBenefits(benefitsRes.data);
            setForm(formRes.data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка загрузки' });
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post('http://localhost:5000/api/admin/upload', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            return response.data.url;
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка загрузки изображения' });
            return null;
        }
    };

    const handleImageUpload = async (e, target, benefitId = null) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const imageUrl = await uploadImage(file);
        if (imageUrl) {
            if (target === 'banner') {
                setBanner({ ...banner, image_url: imageUrl });
            } else if (target === 'benefit' && benefitId) {
                updateBenefit(benefitId, { ...benefits.find(b => b.id === benefitId), image_url: imageUrl });
            }
            setMessage({ type: 'success', text: 'Изображение загружено!' });
            setTimeout(() => setMessage(null), 2000);
        }
        setUploading(false);
        e.target.value = '';
    };

    const saveAll = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            await Promise.all([
                axios.put('http://localhost:5000/api/admin/credit-banner', banner, { headers: { Authorization: `Bearer ${token}` } }),
                axios.put('http://localhost:5000/api/admin/credit-form', form, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setMessage({ type: 'success', text: 'Сохранено!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Ошибка сохранения' });
        } finally {
            setSaving(false);
        }
    };

    const updateBenefit = async (id, updates) => {
        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`http://localhost:5000/api/admin/credit-benefits/${id}`, updates, { headers: { Authorization: `Bearer ${token}` } });
            await fetchAllData();
        } catch (error) { console.error(error); }
    };

    const addBenefit = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            await axios.post('http://localhost:5000/api/admin/credit-benefits',
                { title: 'Новое преимущество', description: 'Описание', image_url: '/images/placeholder.svg', order_position: benefits.length + 1, is_active: true },
                { headers: { Authorization: `Bearer ${token}` } });
            await fetchAllData();
        } catch (error) { console.error(error); }
    };

    const deleteBenefit = async (id) => {
        if (!confirm('Удалить преимущество?')) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`http://localhost:5000/api/admin/credit-benefits/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            await fetchAllData();
        } catch (error) { console.error(error); }
    };

    const handleBackToDashboard = () => {
        navigate('/admin/dashboard');
    };

    if (loading) return <div className={s.loading}>Загрузка...</div>;

    return (
        <div className={s.pageManager}>
            <div className={s.header}>
                <button onClick={handleBackToDashboard} className={s.backBtn}>← Назад к дашборду</button>
                <h2>Управление страницей "Кредит"</h2>
                <button onClick={saveAll} disabled={saving} className={s.saveAllBtn}>{saving ? "Сохранение..." : "Сохранить все"}</button>
            </div>
            {message && <div className={`${s.message} ${s[message.type]}`}>{message.text}</div>}
            {uploading && <div className={s.uploadingOverlay}>Загрузка изображения...</div>}

            <div className={s.tabs}>
                <button className={`${s.tab} ${activeTab === 'banner' ? s.activeTab : ''}`} onClick={() => setActiveTab('banner')}>Баннер</button>
                <button className={`${s.tab} ${activeTab === 'benefits' ? s.activeTab : ''}`} onClick={() => setActiveTab('benefits')}>Преимущества</button>
                <button className={`${s.tab} ${activeTab === 'form' ? s.activeTab : ''}`} onClick={() => setActiveTab('form')}>Форма</button>
            </div>

            {/* Баннер */}
            {activeTab === 'banner' && (
                <div className={s.section}>
                    <h3>Баннер кредита</h3>
                    <div className={s.formGroup}><label>Заголовок</label><textarea value={banner.title} onChange={(e) => setBanner({...banner, title: e.target.value})} rows="2" /></div>
                    <div className={s.formGroup}><label>Описание</label><input type="text" value={banner.description} onChange={(e) => setBanner({...banner, description: e.target.value})} /></div>
                    <div className={s.formRow}>
                        <div className={s.formGroup}><label>Текст кнопки</label><input type="text" value={banner.button_text} onChange={(e) => setBanner({...banner, button_text: e.target.value})} /></div>
                        <div className={s.formGroup}><label>Ссылка</label><input type="text" value={banner.button_link} onChange={(e) => setBanner({...banner, button_link: e.target.value})} /></div>
                    </div>
                    <div className={s.formGroup}>
                        <label>URL изображения</label>
                        <div className={s.uploadArea}>
                            <input type="text" value={banner.image_url} onChange={(e) => setBanner({...banner, image_url: e.target.value})} />
                            <div className={s.uploadButtons}>
                                <label className={s.uploadBtn}>📁 Выбрать файл
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </div>
                        {banner.image_url && (
                            <div className={s.imagePreview}>
                                <img src={banner.image_url} alt="Preview" />
                                <button className={s.removeImageBtn} onClick={() => setBanner({...banner, image_url: ''})}>✕</button>
                            </div>
                        )}
                    </div>
                    <label className={s.checkbox}><input type="checkbox" checked={banner.is_active} onChange={(e) => setBanner({...banner, is_active: e.target.checked})} /> Активен</label>
                </div>
            )}

            {/* Преимущества */}
            {activeTab === 'benefits' && (
                <div className={s.section}>
                    <div className={s.blockHeader}><h3>Преимущества</h3><button onClick={addBenefit} className={s.addBtn}>+ Добавить</button></div>
                    <div className={s.benefitsGrid}>
                        {benefits.map(b => (
                            <div key={b.id} className={s.benefitCard}>
                                <div className={s.cardHeader}><h4>{b.title}</h4><button onClick={() => deleteBenefit(b.id)} className={s.deleteBtn}>Удалить</button></div>
                                <div className={s.formGroup}><label>Заголовок</label><input type="text" value={b.title} onChange={(e) => updateBenefit(b.id, { ...b, title: e.target.value })} /></div>
                                <div className={s.formGroup}><label>Описание</label><input type="text" value={b.description} onChange={(e) => updateBenefit(b.id, { ...b, description: e.target.value })} /></div>
                                <div className={s.formGroup}>
                                    <label>URL иконки</label>
                                    <div className={s.uploadArea}>
                                        <input type="text" value={b.image_url} onChange={(e) => updateBenefit(b.id, { ...b, image_url: e.target.value })} />
                                        <div className={s.uploadButtons}>
                                            <label className={s.uploadBtn}>📁 Выбрать файл
                                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'benefit', b.id)} style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                    </div>
                                    {b.image_url && <div className={s.imagePreview}><img src={b.image_url} alt="Preview" /><button className={s.removeImageBtn} onClick={() => updateBenefit(b.id, { ...b, image_url: '' })}>✕</button></div>}
                                </div>
                                <div className={s.formGroup}><label>Порядок</label><input type="number" value={b.order_position} onChange={(e) => updateBenefit(b.id, { ...b, order_position: parseInt(e.target.value) })} /></div>
                                <label className={s.checkbox}><input type="checkbox" checked={b.is_active} onChange={(e) => updateBenefit(b.id, { ...b, is_active: e.target.checked })} /> Активен</label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Форма */}
            {activeTab === 'form' && (
                <div className={s.section}>
                    <h3>Форма заявки</h3>
                    <div className={s.formGroup}><label>Заголовок формы</label><input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} /></div>
                    <div className={s.formGroup}><label>Текст кнопки</label><input type="text" value={form.button_text} onChange={(e) => setForm({...form, button_text: e.target.value})} /></div>
                    <label className={s.checkbox}><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} /> Форма активна</label>
                </div>
            )}
        </div>
    );
};

export default CreditPageManager;
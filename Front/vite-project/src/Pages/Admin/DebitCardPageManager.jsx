import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import s from './DebitCardPageManager.module.scss';

const DebitCardPageManager = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('banner');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Баннер
    const [banner, setBanner] = useState({
        title: '',
        description: '',
        button_text: '',
        button_link: '',
        image_url: '',
        is_active: true
    });
    
    // Преимущества
    const [benefits, setBenefits] = useState([]);
    
    // Форма
    const [form, setForm] = useState({
        title: '',
        button_text: '',
        fields: [],
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
                axios.get('http://localhost:5000/api/admin/debit-card-banner', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/admin/debit-card-benefits', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/admin/debit-card-form', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            setBanner(bannerRes.data);
            setBenefits(benefitsRes.data);
            setForm(formRes.data);
        } catch (error) {
            console.error('Failed to fetch:', error);
            setMessage({ type: 'error', text: 'Ошибка загрузки данных' });
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
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data.url;
        } catch (error) {
            console.error('Upload error:', error);
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
        setMessage(null);
        
        try {
            const token = localStorage.getItem('adminToken');
            
            await Promise.all([
                axios.put('http://localhost:5000/api/admin/debit-card-banner', banner, { headers: { Authorization: `Bearer ${token}` } }),
                axios.put('http://localhost:5000/api/admin/debit-card-form', form, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            setMessage({ type: 'success', text: 'Все изменения сохранены!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Save error:', error);
            setMessage({ type: 'error', text: 'Ошибка сохранения' });
        } finally {
            setSaving(false);
        }
    };

    const updateBenefit = async (id, updates) => {
        const token = localStorage.getItem('adminToken');
        try {
            await axios.put(`http://localhost:5000/api/admin/debit-card-benefits/${id}`, updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchAllData();
            setMessage({ type: 'success', text: 'Преимущество обновлено!' });
            setTimeout(() => setMessage(null), 2000);
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const addBenefit = async () => {
        const newBenefit = {
            title: 'Новое преимущество',
            image_url: '/images/placeholder.svg',
            order_position: benefits.length + 1,
            is_active: true
        };
        
        const token = localStorage.getItem('adminToken');
        try {
            await axios.post('http://localhost:5000/api/admin/debit-card-benefits', newBenefit, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchAllData();
            setMessage({ type: 'success', text: 'Преимущество добавлено!' });
        } catch (error) {
            console.error('Add error:', error);
        }
    };

    const deleteBenefit = async (id) => {
        if (!confirm('Удалить преимущество?')) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`http://localhost:5000/api/admin/debit-card-benefits/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchAllData();
            setMessage({ type: 'success', text: 'Преимущество удалено!' });
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/admin/dashboard');
    };

    if (loading) return <div className={s.loading}>Загрузка...</div>;

    return (
        <div className={s.pageManager}>
            <div className={s.header}>
                <button onClick={handleBackToDashboard} className={s.backBtn}>
                    ← Назад к дашборду
                </button>
                <h2>Управление страницей "Дебетовая карта"</h2>
                <button onClick={saveAll} disabled={saving} className={s.saveAllBtn}>
                    {saving ? 'Сохранение...' : 'Сохранить все'}
                </button>
            </div>

            {message && (
                <div className={`${s.message} ${s[message.type]}`}>
                    {message.text}
                </div>
            )}

            {uploading && <div className={s.uploadingOverlay}>Загрузка изображения...</div>}

            <div className={s.tabs}>
                <button className={`${s.tab} ${activeTab === 'banner' ? s.activeTab : ''}`} onClick={() => setActiveTab('banner')}>
                    Баннер
                </button>
                <button className={`${s.tab} ${activeTab === 'benefits' ? s.activeTab : ''}`} onClick={() => setActiveTab('benefits')}>
                    Преимущества
                </button>
                <button className={`${s.tab} ${activeTab === 'form' ? s.activeTab : ''}`} onClick={() => setActiveTab('form')}>
                    Форма
                </button>
            </div>

            {/* Баннер */}
            {activeTab === 'banner' && (
                <div className={s.section}>
                    <h3>Баннер дебетовой карты</h3>
                    <div className={s.formGroup}>
                        <label>Заголовок</label>
                        <textarea value={banner.title} onChange={(e) => setBanner({...banner, title: e.target.value})} rows="2" />
                    </div>
                    <div className={s.formGroup}>
                        <label>Описание</label>
                        <input type="text" value={banner.description} onChange={(e) => setBanner({...banner, description: e.target.value})} />
                    </div>
                    <div className={s.formRow}>
                        <div className={s.formGroup}>
                            <label>Текст кнопки</label>
                            <input type="text" value={banner.button_text} onChange={(e) => setBanner({...banner, button_text: e.target.value})} />
                        </div>
                        <div className={s.formGroup}>
                            <label>Ссылка кнопки</label>
                            <input type="text" value={banner.button_link} onChange={(e) => setBanner({...banner, button_link: e.target.value})} />
                        </div>
                    </div>
                    <div className={s.formGroup}>
                        <label>URL изображения</label>
                        <div className={s.uploadArea}>
                            <input 
                                type="text" 
                                value={banner.image_url} 
                                onChange={(e) => setBanner({...banner, image_url: e.target.value})} 
                                placeholder="https://example.com/image.jpg"
                            />
                            <div className={s.uploadButtons}>
                                <label className={s.uploadBtn}>
                                    📁 Выбрать файл
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'banner')}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>
                        {banner.image_url && (
                            <div className={s.imagePreview}>
                                <img src={banner.image_url} alt="Preview" />
                                <button 
                                    className={s.removeImageBtn}
                                    onClick={() => setBanner({...banner, image_url: ''})}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                    <div className={s.checkboxGroup}>
                        <label className={s.checkbox}>
                            <input type="checkbox" checked={banner.is_active} onChange={(e) => setBanner({...banner, is_active: e.target.checked})} />
                            <span>Активен</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Преимущества */}
            {activeTab === 'benefits' && (
                <div className={s.section}>
                    <div className={s.blockHeader}>
                        <h3>Преимущества</h3>
                        <button onClick={addBenefit} className={s.addBtn}>+ Добавить</button>
                    </div>
                    <div className={s.benefitsGrid}>
                        {benefits.map((benefit) => (
                            <div key={benefit.id} className={s.benefitCard}>
                                <div className={s.cardHeader}>
                                    <h4>{benefit.title}</h4>
                                    <button onClick={() => deleteBenefit(benefit.id)} className={s.deleteBtn}>Удалить</button>
                                </div>
                                <div className={s.formGroup}>
                                    <label>Заголовок</label>
                                    <input 
                                        type="text" 
                                        value={benefit.title} 
                                        onChange={(e) => updateBenefit(benefit.id, { ...benefit, title: e.target.value })} 
                                    />
                                </div>
                                <div className={s.formGroup}>
                                    <label>URL иконки</label>
                                    <div className={s.uploadArea}>
                                        <input 
                                            type="text" 
                                            value={benefit.image_url} 
                                            onChange={(e) => updateBenefit(benefit.id, { ...benefit, image_url: e.target.value })} 
                                            placeholder="https://example.com/icon.svg"
                                        />
                                        <div className={s.uploadButtons}>
                                            <label className={s.uploadBtn}>
                                                📁 Выбрать файл
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'benefit', benefit.id)}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    {benefit.image_url && (
                                        <div className={s.imagePreview}>
                                            <img src={benefit.image_url} alt="Icon" />
                                            <button 
                                                className={s.removeImageBtn}
                                                onClick={() => updateBenefit(benefit.id, { ...benefit, image_url: '' })}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={s.formGroup}>
                                    <label>Порядок</label>
                                    <input 
                                        type="number" 
                                        value={benefit.order_position} 
                                        onChange={(e) => updateBenefit(benefit.id, { ...benefit, order_position: parseInt(e.target.value) })} 
                                    />
                                </div>
                                <label className={s.checkbox}>
                                    <input 
                                        type="checkbox" 
                                        checked={benefit.is_active} 
                                        onChange={(e) => updateBenefit(benefit.id, { ...benefit, is_active: e.target.checked })} 
                                    />
                                    <span>Активен</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Форма */}
            {activeTab === 'form' && (
                <div className={s.section}>
                    <h3>Форма оформления</h3>
                    <div className={s.formGroup}>
                        <label>Заголовок формы</label>
                        <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
                    </div>
                    <div className={s.formGroup}>
                        <label>Текст кнопки</label>
                        <input type="text" value={form.button_text} onChange={(e) => setForm({...form, button_text: e.target.value})} />
                    </div>
                    <div className={s.checkboxGroup}>
                        <label className={s.checkbox}>
                            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} />
                            <span>Форма активна</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebitCardPageManager;
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import s from './HomePage.module.scss';

const HomePageManager = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('mainBanner');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Данные для всех блоков
    const [mainBanner, setMainBanner] = useState({
        title: '',
        description: '',
        button_text: '',
        button_link: '',
        background_image_url: '',
        is_active: true
    });
    
    const [advBlock, setAdvBlock] = useState({
        title: '',
        description: '',
        button_text: '',
        button_link: '',
        image_url: '',
        is_active: true
    });
    
    const [aboutBank, setAboutBank] = useState({
        heading: '',
        bestservice: {
            title: '',
            description: '',
            image_url: '',
            is_active: true
        },
        secondadv: {
            title: '',
            description: '',
            image_url: '',
            is_active: true
        },
        thirdadv: {
            title: '',
            description: '',
            image_url: '',
            is_active: true
        }
    });
    
    const [interestBlocks, setInterestBlocks] = useState([]);
    // Локальное состояние для редактируемых блоков интересов
    const [editingBlocks, setEditingBlocks] = useState({});

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            
            const [mainBannerRes, advBlockRes, aboutBankRes, interestBlocksRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/main-banner', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/admin/adv-block', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/admin/about-bank', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/admin/interest-blocks', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            setMainBanner(mainBannerRes.data);
            setAdvBlock(advBlockRes.data);
            setAboutBank(aboutBankRes.data);
            setInterestBlocks(interestBlocksRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
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

    const handleImageUpload = async (e, target, blockId = null) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        const imageUrl = await uploadImage(file);
        
        if (imageUrl) {
            if (target === 'mainBanner') {
                setMainBanner({ ...mainBanner, background_image_url: imageUrl });
            } else if (target === 'advBlock') {
                setAdvBlock({ ...advBlock, image_url: imageUrl });
            } else if (target.startsWith('aboutBank_')) {
                const block = target.split('_')[1];
                setAboutBank({
                    ...aboutBank,
                    [block]: { ...aboutBank[block], image_url: imageUrl }
                });
            } else if (target === 'interestBlock' && blockId) {
                // Обновляем локальное состояние
                setEditingBlocks(prev => ({
                    ...prev,
                    [blockId]: { ...(prev[blockId] || getOriginalBlock(blockId)), image_url: imageUrl }
                }));
            }
            setMessage({ type: 'success', text: 'Изображение загружено!' });
            setTimeout(() => setMessage(null), 2000);
        }
        
        setUploading(false);
        e.target.value = '';
    };

    const getOriginalBlock = (id) => {
        return interestBlocks.find(b => b.id === id);
    };

    const saveAllData = async () => {
        setSaving(true);
        setMessage(null);
        
        try {
            const token = localStorage.getItem('adminToken');
            
            // Сохраняем основные блоки
            await Promise.all([
                axios.put('http://localhost:5000/api/admin/main-banner', mainBanner, { headers: { Authorization: `Bearer ${token}` } }),
                axios.put('http://localhost:5000/api/admin/adv-block', advBlock, { headers: { Authorization: `Bearer ${token}` } }),
                axios.put('http://localhost:5000/api/admin/about-bank', aboutBank, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            // Сохраняем все измененные блоки интересов
            const savePromises = Object.keys(editingBlocks).map(id => {
                const block = editingBlocks[id];
                return axios.put(`http://localhost:5000/api/admin/interest-blocks/${id}`, block, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            });
            
            if (savePromises.length > 0) {
                await Promise.all(savePromises);
                // Очищаем локальные изменения после сохранения
                setEditingBlocks({});
                await fetchAllData();
            }
            
            setMessage({ type: 'success', text: 'Все изменения успешно сохранены!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save data:', error);
            setMessage({ type: 'error', text: 'Ошибка при сохранении' });
        } finally {
            setSaving(false);
        }
    };

    // Обновление локального состояния блока (без отправки на сервер)
    const handleInterestBlockChange = (id, field, value) => {
        setEditingBlocks(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || interestBlocks.find(b => b.id === id)),
                [field]: value
            }
        }));
    };

    // Получение актуальных данных блока (локальные изменения или из store)
    const getInterestBlockData = (id) => {
        return editingBlocks[id] || interestBlocks.find(b => b.id === id);
    };

    const deleteInterestBlock = async (id) => {
        if (!confirm('Удалить этот блок?')) return;
        const token = localStorage.getItem('adminToken');
        try {
            await axios.delete(`http://localhost:5000/api/admin/interest-blocks/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Удаляем из локального состояния
            setEditingBlocks(prev => {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            });
            await fetchAllData();
            setMessage({ type: 'success', text: 'Блок удален!' });
            setTimeout(() => setMessage(null), 2000);
        } catch (error) {
            console.error('Failed to delete block:', error);
            setMessage({ type: 'error', text: 'Ошибка при удалении' });
        }
    };

    const addInterestBlock = async () => {
        const newBlock = {
            title: 'Новый блок',
            description: 'Описание блока',
            image_url: '',
            link: '/',
            block_type: 'debit_card',
            order_position: interestBlocks.length + 1,
            is_active: true
        };
        
        const token = localStorage.getItem('adminToken');
        try {
            const response = await axios.post('http://localhost:5000/api/admin/interest-blocks', newBlock, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchAllData();
            setMessage({ type: 'success', text: 'Блок добавлен!' });
            setTimeout(() => setMessage(null), 2000);
        } catch (error) {
            console.error('Failed to add block:', error);
            setMessage({ type: 'error', text: 'Ошибка при добавлении' });
        }
    };

    const handleBackToDashboard = () => {
        navigate('/admin/dashboard');
    };

    const tabs = [
        { id: 'mainBanner', label: 'Главный баннер', icon: '' },
        { id: 'advBlock', label: 'Рекламный блок', icon: '' },
        { id: 'aboutBank', label: 'О банке', icon: '' },
        { id: 'interestBlocks', label: 'Блоки интересов', icon: '' }
    ];

    if (loading) return <div className={s.loading}>Загрузка данных...</div>;

    return (
        <div className={s.homepageManager}>
            <div className={s.header}>
                <button onClick={handleBackToDashboard} className={s.backBtn}>
                    ← Назад к дашборду
                </button>
                <h2>Управление главной страницей</h2>
                <button onClick={saveAllData} disabled={saving} className={s.saveAllBtn}>
                    {saving ? 'Сохранение...' : 'Сохранить все изменения'}
                </button>
            </div>

            {message && (
                <div className={`${s.message} ${s[message.type]}`}>
                    {message.text}
                </div>
            )}

            {uploading && <div className={s.uploadingOverlay}>Загрузка изображения...</div>}

            {/* Табы */}
            <div className={s.tabs}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${s.tab} ${activeTab === tab.id ? s.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Контент табов */}
            <div className={s.tabContent}>
                {/* Главный баннер */}
                {activeTab === 'mainBanner' && (
                    <div className={s.section}>
                        <h3>Главный баннер</h3>
                        <div className={s.formGroup}>
                            <label>Заголовок</label>
                            <textarea
                                value={mainBanner.title}
                                onChange={(e) => setMainBanner({...mainBanner, title: e.target.value})}
                                rows="3"
                            />
                        </div>
                        <div className={s.formGroup}>
                            <label>Описание</label>
                            <input
                                type="text"
                                value={mainBanner.description}
                                onChange={(e) => setMainBanner({...mainBanner, description: e.target.value})}
                            />
                        </div>
                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Текст кнопки</label>
                                <input
                                    type="text"
                                    value={mainBanner.button_text}
                                    onChange={(e) => setMainBanner({...mainBanner, button_text: e.target.value})}
                                />
                            </div>
                            <div className={s.formGroup}>
                                <label>Ссылка кнопки</label>
                                <input
                                    type="text"
                                    value={mainBanner.button_link}
                                    onChange={(e) => setMainBanner({...mainBanner, button_link: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className={s.formGroup}>
                            <label>URL фонового изображения</label>
                            <div className={s.uploadArea}>
                                <input
                                    type="text"
                                    value={mainBanner.background_image_url}
                                    onChange={(e) => setMainBanner({...mainBanner, background_image_url: e.target.value})}
                                    placeholder="https://example.com/image.jpg"
                                />
                                <div className={s.uploadButtons}>
                                    <label className={s.uploadBtn}>
                                        📁 Выбрать файл
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'mainBanner')}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>
                            {mainBanner.background_image_url && (
                                <div className={s.imagePreview}>
                                    <img src={mainBanner.background_image_url} alt="Preview" />
                                    <button 
                                        className={s.removeImageBtn}
                                        onClick={() => setMainBanner({...mainBanner, background_image_url: ''})}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={s.checkboxGroup}>
                            <label className={s.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={mainBanner.is_active}
                                    onChange={(e) => setMainBanner({...mainBanner, is_active: e.target.checked})}
                                />
                                <span>Активен</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Рекламный блок */}
                {activeTab === 'advBlock' && (
                    <div className={s.section}>
                        <h3>Рекламный блок</h3>
                        <div className={s.formGroup}>
                            <label>Заголовок</label>
                            <textarea
                                value={advBlock.title}
                                onChange={(e) => setAdvBlock({...advBlock, title: e.target.value})}
                                rows="3"
                            />
                        </div>
                        <div className={s.formGroup}>
                            <label>Описание</label>
                            <textarea
                                value={advBlock.description}
                                onChange={(e) => setAdvBlock({...advBlock, description: e.target.value})}
                                rows="4"
                            />
                        </div>
                        <div className={s.formRow}>
                            <div className={s.formGroup}>
                                <label>Текст кнопки</label>
                                <input
                                    type="text"
                                    value={advBlock.button_text}
                                    onChange={(e) => setAdvBlock({...advBlock, button_text: e.target.value})}
                                />
                            </div>
                            <div className={s.formGroup}>
                                <label>Ссылка кнопки</label>
                                <input
                                    type="text"
                                    value={advBlock.button_link}
                                    onChange={(e) => setAdvBlock({...advBlock, button_link: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className={s.formGroup}>
                            <label>URL изображения</label>
                            <div className={s.uploadArea}>
                                <input
                                    type="text"
                                    value={advBlock.image_url}
                                    onChange={(e) => setAdvBlock({...advBlock, image_url: e.target.value})}
                                    placeholder="https://example.com/image.jpg"
                                />
                                <div className={s.uploadButtons}>
                                    <label className={s.uploadBtn}>
                                        📁 Выбрать файл
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'advBlock')}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>
                            {advBlock.image_url && (
                                <div className={s.imagePreview}>
                                    <img src={advBlock.image_url} alt="Preview" />
                                    <button 
                                        className={s.removeImageBtn}
                                        onClick={() => setAdvBlock({...advBlock, image_url: ''})}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={s.checkboxGroup}>
                            <label className={s.checkbox}>
                                <input
                                    type="checkbox"
                                    checked={advBlock.is_active}
                                    onChange={(e) => setAdvBlock({...advBlock, is_active: e.target.checked})}
                                />
                                <span>Активен</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* О банке */}
                {activeTab === 'aboutBank' && (
                    <div className={s.section}>
                        <h3>О банке</h3>
                        <div className={s.formGroup}>
                            <label>Заголовок раздела</label>
                            <input
                                type="text"
                                value={aboutBank.heading}
                                onChange={(e) => setAboutBank({...aboutBank, heading: e.target.value})}
                            />
                        </div>
                        
                        {/* Подблоки с загрузкой изображений */}
                        {['bestservice', 'secondadv', 'thirdadv'].map((block, idx) => {
                            const titles = ['Признание в обслуживании', 'Крупнейший частный банк', 'Инновации в платежных технологиях'];
                            const blockData = aboutBank[block];
                            return (
                                <div key={block} className={s.subsection}>
                                    <h4>Блок {idx + 1}: {titles[idx]}</h4>
                                    <div className={s.formGroup}>
                                        <label>Заголовок</label>
                                        <input
                                            type="text"
                                            value={blockData.title}
                                            onChange={(e) => setAboutBank({
                                                ...aboutBank,
                                                [block]: {...blockData, title: e.target.value}
                                            })}
                                        />
                                    </div>
                                    <div className={s.formGroup}>
                                        <label>Описание</label>
                                        <textarea
                                            value={blockData.description}
                                            onChange={(e) => setAboutBank({
                                                ...aboutBank,
                                                [block]: {...blockData, description: e.target.value}
                                            })}
                                            rows="4"
                                        />
                                    </div>
                                    <div className={s.formGroup}>
                                        <label>URL изображения</label>
                                        <div className={s.uploadArea}>
                                            <input
                                                type="text"
                                                value={blockData.image_url}
                                                onChange={(e) => setAboutBank({
                                                    ...aboutBank,
                                                    [block]: {...blockData, image_url: e.target.value}
                                                })}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                            <div className={s.uploadButtons}>
                                                <label className={s.uploadBtn}>
                                                    📁 Выбрать файл
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, `aboutBank_${block}`)}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        {blockData.image_url && (
                                            <div className={s.imagePreview}>
                                                <img src={blockData.image_url} alt="Preview" />
                                                <button 
                                                    className={s.removeImageBtn}
                                                    onClick={() => setAboutBank({
                                                        ...aboutBank,
                                                        [block]: {...blockData, image_url: ''}
                                                    })}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className={s.checkboxGroup}>
                                        <label className={s.checkbox}>
                                            <input
                                                type="checkbox"
                                                checked={blockData.is_active}
                                                onChange={(e) => setAboutBank({
                                                    ...aboutBank,
                                                    [block]: {...blockData, is_active: e.target.checked}
                                                })}
                                            />
                                            <span>Активен</span>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Блоки интересов */}
                {activeTab === 'interestBlocks' && (
                    <div className={s.section}>
                        <div className={s.blockHeader}>
                            <h3>Блоки "Вас могут заинтересовать"</h3>
                            <button onClick={addInterestBlock} className={s.addBtn}>+ Добавить блок</button>
                        </div>
                        
                        <div className={s.blocksGrid}>
                            {interestBlocks.map((block, index) => {
                                const currentData = getInterestBlockData(block.id);
                                return (
                                    <div key={block.id} className={s.blockCard}>
                                        <div className={s.blockHeader}>
                                            <h4>Блок {index + 1}</h4>
                                            <button onClick={() => deleteInterestBlock(block.id)} className={s.deleteBtn}>Удалить</button>
                                        </div>
                                        <div className={s.formGroup}>
                                            <label>Заголовок</label>
                                            <input
                                                type="text"
                                                value={currentData.title}
                                                onChange={(e) => handleInterestBlockChange(block.id, 'title', e.target.value)}
                                            />
                                        </div>
                                        <div className={s.formGroup}>
                                            <label>Описание</label>
                                            <input
                                                type="text"
                                                value={currentData.description}
                                                onChange={(e) => handleInterestBlockChange(block.id, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div className={s.formGroup}>
                                            <label>URL изображения</label>
                                            <div className={s.uploadArea}>
                                                <input
                                                    type="text"
                                                    value={currentData.image_url}
                                                    onChange={(e) => handleInterestBlockChange(block.id, 'image_url', e.target.value)}
                                                    placeholder="https://example.com/image.jpg"
                                                />
                                                <div className={s.uploadButtons}>
                                                    <label className={s.uploadBtn}>
                                                        📁 Выбрать файл
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageUpload(e, 'interestBlock', block.id)}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            {currentData.image_url && (
                                                <div className={s.imagePreview}>
                                                    <img src={currentData.image_url} alt="Preview" />
                                                    <button 
                                                        className={s.removeImageBtn}
                                                        onClick={() => handleInterestBlockChange(block.id, 'image_url', '')}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className={s.formRow}>
                                            <div className={s.formGroup}>
                                                <label>Ссылка</label>
                                                <input
                                                    type="text"
                                                    value={currentData.link}
                                                    onChange={(e) => handleInterestBlockChange(block.id, 'link', e.target.value)}
                                                />
                                            </div>
                                            <div className={s.formGroup}>
                                                <label>Порядок</label>
                                                <input
                                                    type="number"
                                                    value={currentData.order_position}
                                                    onChange={(e) => handleInterestBlockChange(block.id, 'order_position', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className={s.checkboxGroup}>
                                            <label className={s.checkbox}>
                                                <input
                                                    type="checkbox"
                                                    checked={currentData.is_active}
                                                    onChange={(e) => handleInterestBlockChange(block.id, 'is_active', e.target.checked)}
                                                />
                                                <span>Активен</span>
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePageManager;
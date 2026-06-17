import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import s from "./mainbanner.module.scss";

const MainBanner = () => {
    const [bannerData, setBannerData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMainBanner();
    }, []);

    const fetchMainBanner = async () => {
        try {
            const response = await fetch('https://diplom-lpv5.onrender.com/api/content/main-banner');
            const data = await response.json();
            setBannerData(data);
        } catch (error) {
            console.error('Failed to fetch main banner:', error);
            // Данные по умолчанию, если сервер не доступен
            setBannerData({
                title: 'Максимум возможностей: Дебетовая карта для активных и умных',
                description: 'Бесплатное обслуживание навсегда',
                button_text: 'Получить карту',
                button_link: '/debit-card',
                background_image_url: '/images/MainBannerImg.png',
                is_active: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleButtonClick = () => {
        if (bannerData?.button_link) {
            navigate(bannerData.button_link);
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    };

    if (loading) {
        return (
            <div className={s.mainbanner}>
                <div className={s.mainbanner__box}>
                    <div className={s.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (!bannerData || bannerData.is_active === false) {
        return null;
    }

    // Формируем URL фонового изображения
    const backgroundImageUrl = bannerData.background_image_url 
        ? bannerData.background_image_url 
        : '/images/MainBannerImg.png';

    return (
        <div className={s.mainbanner}>
            <div className={s.mainbanner__box} style={{
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}>
                <div className={s.mainbanner__heading}>
                    <h1 className={s.mainbanner__h1}>{bannerData.title}</h1>
                    <p className={s.mainbanner__desc}>{bannerData.description}</p>
                </div>

                <div className={s.mainbanner__actionbox}>
                    <button className={s.mainbanner__button} onClick={handleButtonClick}>
                        {bannerData.button_text}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainBanner;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import s from "./advblock.module.scss";

const AdvBlock = () => {
    const [advData, setAdvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAdvBlock();
    }, []);

    const fetchAdvBlock = async () => {
        try {
            const response = await fetch('https://diplom-lpv5.onrender.com/api/content/adv-block');
            const data = await response.json();
            setAdvData(data);
        } catch (error) {
            console.error('Failed to fetch adv block:', error);
            // Данные по умолчанию
            setAdvData({
                title: 'Наши клиенты получают повышенный кэшбэк у партнёров',
                description: 'Ежемесячно мы предлагаем выгодные условия от наших партнёров: кэшбэк на продукты, одежду, технику, развлечения и обучение. Присоединяйтесь и получайте кэшбэк!',
                button_text: 'Стать клиентом',
                button_link: '/debit-card',
                image_url: '/images/AdvBlockimg.svg'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleButtonClick = () => {
        if (advData?.button_link) {
            navigate(advData.button_link);
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    };

    if (loading) {
        return (
            <div className={s.advblock}>
                <div className={s.advblock__box}>
                    <div className={s.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (!advData || advData.is_active === false) {
        return null;
    }

    return (
        <div className={s.advblock}>
            <div className={s.advblock__box}>
                <div className={s.advblock__text}>
                    <h3 className={s.advblock__title}>{advData.title}</h3>
                    <div className={s.advblock__descbox}>
                        <p className={s.advblock__desc}>{advData.description}</p>

                        <div className={s.advblock__btnbox}>
                            <button className={s.advblock__btn} onClick={handleButtonClick}>
                                {advData.button_text}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={s.advblock__imagebox}>
                    <img className={s.advblock__image} src={advData.image_url} alt="Advantage" />
                </div>
            </div>
        </div>
    );
};

export default AdvBlock;
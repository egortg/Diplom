import { useState, useEffect } from 'react';
import s from "./aboutbank.module.scss";

const AboutBank = () => {
    const [aboutData, setAboutData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAboutBank();
    }, []);

    const fetchAboutBank = async () => {
        try {
            const response = await fetch('https://diplom-lpv5.onrender.com/api/content/about-bank');
            const data = await response.json();
            setAboutData(data);
        } catch (error) {
            console.error('Failed to fetch about bank:', error);
            // Данные по умолчанию с правильными путями
            setAboutData({
                heading: 'О банке',
                bestservice: {
                    title: 'Признание в обслуживании клиентов',
                    description: 'В 2023 году получил награды в рамках международной премии Customer Centricity World Series за лучшую стратегию обслуживания клиентов и бизнес-трансформацию премиального обслуживания.',
                    image_url: '/images/AboutSchema.svg',
                    is_active: true
                },
                secondadv: {
                    title: 'Крупнейший частный банк',
                    description: '30 миллионов клиентов выбрали нас\n\n525+ офисов и доставка более чем в 1500 городов',
                    image_url: '/images/AboutTerminal.svg',
                    is_active: true
                },
                thirdadv: {
                    title: 'Инновации в платежных технологиях',
                    description: 'Лучший кейс в технологиях платежей и расчетов.',
                    image_url: '/images/AboutAtm.svg',
                    is_active: true
                }
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={s.aboutbank}>
                <div className={s.aboutbank__box}>
                    <div className={s.loading}>Загрузка...</div>
                </div>
            </div>
        );
    }

    if (!aboutData) {
        return null;
    }

    return (
        <div className={s.aboutbank}>
            <div className={s.aboutbank__box}>
                <div className={s.aboutbank__heading}>
                    <h2 className={s.aboutbank__h2}>{aboutData.heading}</h2>
                </div>

                <div className={s.aboutbank__info}>
                    {/* Блок 1 - Лучший сервис */}
                    {aboutData.bestservice && aboutData.bestservice.is_active !== false && (
                        <div className={s.aboutbank__bestservicebox}>
                            <div className={s.aboutbank__bestservicetext}>
                                <h3 className={s.aboutbank__bestservicetitle}>
                                    {aboutData.bestservice.title}
                                </h3>
                                <p className={s.aboutbank__bestservicedesc}>
                                    {aboutData.bestservice.description}
                                </p>
                            </div>

                            <div className={s.aboutbank__bestserviceimage}>
                                <img 
                                    src={aboutData.bestservice.image_url || '/images/AboutSchema.svg'} 
                                    alt={aboutData.bestservice.title}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/images/AboutSchema.svg';
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className={s.aboutbank__otheradv}>
                        {/* Блок 2 - Крупнейший частный банк */}
                        {aboutData.secondadv && aboutData.secondadv.is_active !== false && (
                            <div className={s.aboutbank__secondadvbox}>
                                <div className={s.aboutbank__secondadvtext}>
                                    <h3 className={s.aboutbank__secondadvtitle}>
                                        {aboutData.secondadv.title}
                                    </h3>
                                    <p className={s.aboutbank__secondadvdesc}>
                                        {aboutData.secondadv.description?.split('\n').map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                {i < aboutData.secondadv.description.split('\n').length - 1 && <br />}
                                            </span>
                                        ))}
                                    </p>
                                </div>

                                <div className={s.aboutbank__secondadvimage}>
                                    <img 
                                        src={aboutData.secondadv.image_url || '/images/AboutTerminal.svg'} 
                                        alt={aboutData.secondadv.title}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/AboutTerminal.svg';
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Блок 3 - Инновации */}
                        {aboutData.thirdadv && aboutData.thirdadv.is_active !== false && (
                            <div className={s.aboutbank__thirdadvbox}>
                                <div className={s.aboutbank__thirdadvtext}>
                                    <h3 className={s.aboutbank__thirdadvtitle}>
                                        {aboutData.thirdadv.title}
                                    </h3>
                                    <p className={s.aboutbank__thirdadvdesc}>
                                        {aboutData.thirdadv.description}
                                    </p>
                                </div>

                                <div className={s.aboutbank__thirdadvimage}>
                                    <img 
                                        src={aboutData.thirdadv.image_url || '/images/AboutAtm.svg'} 
                                        alt={aboutData.thirdadv.title}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/images/AboutAtm.svg';
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutBank;
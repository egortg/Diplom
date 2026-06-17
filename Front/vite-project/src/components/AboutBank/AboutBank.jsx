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
            // Данные по умолчанию
            setAboutData({
                heading: 'О банке',
                bestservice: {
                    title: 'Признание в обслуживании клиентов',
                    description: 'В 2023 году получил награды в рамках международной премии Customer Centricity World Series за лучшую стратегию обслуживания клиентов и бизнес-трансформацию премиального обслуживания.',
                    image_url: '/images/AboutSchema.svg'
                },
                secondadv: {
                    title: 'Крупнейший частный банк',
                    description: '30 миллионов клиентов выбрали нас\n\n525+ офисов и доставка более чем в 1500 городов',
                    image_url: '/images/AboutTerminal.svg'
                },
                thirdadv: {
                    title: 'Инновации в платежных технологиях',
                    description: 'Лучший кейс в технологиях платежей и расчетов.',
                    image_url: '/images/AboutAtm.svg'
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
                    {aboutData.bestservice && (
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
                                <img className={s.aboutbank__bestserviceimg}src={aboutData.bestservice.image_url} alt={aboutData.bestservice.title} />
                            </div>
                        </div>
                    )}

                    <div className={s.aboutbank__otheradv}>
                        {/* Блок 2 - Крупнейший частный банк */}
                        {aboutData.secondadv && (
                            <div className={s.aboutbank__secondadvbox}>
                                <div className={s.aboutbank__secondadvtext}>
                                    <h3 className={s.aboutbank__secondadvtitle}>
                                        {aboutData.secondadv.title}
                                    </h3>
                                    <p className={s.aboutbank__secondadvdesc}>
                                        {aboutData.secondadv.description.split('\n').map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                {i < aboutData.secondadv.description.split('\n').length - 1 && <br />}
                                            </span>
                                        ))}
                                    </p>
                                </div>

                                <div className={s.aboutbank__secondadvimage}>
                                    <img  className={s.aboutbank__secondadvimg} src={aboutData.secondadv.image_url} alt={aboutData.secondadv.title} />
                                </div>
                            </div>
                        )}

                        {/* Блок 3 - Инновации */}
                        {aboutData.thirdadv && (
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
                                    <img className={s.aboutbank__thirdadvimg} src={aboutData.thirdadv.image_url} alt={aboutData.thirdadv.title} />
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
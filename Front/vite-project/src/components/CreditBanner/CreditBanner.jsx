import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import s from "./creditbanner.module.scss";

const CreditBanner = () => {
  const navigate = useNavigate();
  const [bannerData, setBannerData] = useState(null);
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const formRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bannerRes, benefitsRes] = await Promise.all([
        fetch('https://diplom-lpv5.onrender.com/api/content/credit-banner'),
        fetch('https://diplom-lpv5.onrender.com/api/content/credit-benefits')
      ]);
      
      const banner = await bannerRes.json();
      const benefitsData = await benefitsRes.json();
      
      setBannerData(banner);
      setBenefits(benefitsData);
    } catch (error) {
      console.error('Failed to fetch:', error);
      setBannerData({
        title: 'Оформите кредит',
        description: 'Получите деньги уже сегодня',
        button_text: 'Получить деньги',
        button_link: '#credit-form',
        image_url: '/images/CreditBannerimg.png',
        is_active: true
      });
      setBenefits([
        { id: 1, title: 'До 15 млн ₽', description: 'Сумма кредита', image_url: '/images/CreditbenefitimgCash.svg', is_active: true },
        { id: 2, title: 'От 1 до 15 лет', description: 'Срок кредита', image_url: '/images/CreditbenefitimgClock.svg', is_active: true },
        { id: 3, title: 'Доставка Кредита', description: 'На дебетовую карту', image_url: '/images/CreditbenefitimgCalendar.svg', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (loading) return <div className={s.creditbanner}>Загрузка...</div>;
  if (!bannerData || bannerData.is_active === false) return null;

  return (
    <>
      <div className={s.creditbanner}>
        <div className={s.creditbanner__box}>
          <div className={s.creditbanner__text}>
            <h2 className={s.creditbanner__title}>{bannerData.title}</h2>
            <p className={s.creditbanner__desc}>{bannerData.description}</p>

            <div className={s.creditbanner__btnbox}>
              <button className={s.creditbanner__btn} onClick={scrollToForm}>
                {bannerData.button_text}
              </button>
            </div>
          </div>

          <div className={s.creditbanner__imgbox}>
            <img src={bannerData.image_url} alt="Credit" />
          </div>

          <div className={s.creditbanner__benefitsbox}>
            {benefits.filter(b => b.is_active !== false).map((benefit) => (
              <div key={benefit.id} className={s.creditbanner__benefit}>
                <div className={s.creditbanner__benefittext}>
                  <img  className={s.creditbanner__benefitimg} src={benefit.image_url} alt={benefit.title} />
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div ref={formRef} id="credit-form" className={s.formblock}></div>
    </>
  );
};

export default CreditBanner;
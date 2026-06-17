import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import s from "./debitcardbanner.module.scss";

const Benefit = ({ title, imageSrc }) => {
  return (
    <div className={s.debitbanner__benefit}>
      <div className={s.debitbanner__benefittext}>
        <h3 className={s.debitbanner__benefittitle}>{title}</h3>
      </div>
      <div className={s.debitbanner__benefitimgbox}>
        <img 
          src={imageSrc} 
          alt={title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/BenefitOneimgWallet.svg';
          }}
        />
      </div>
    </div>
  );
};

const DebitCardBanner = () => {
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
        fetch('https://diplom-lpv5.onrender.com/api/content/debit-card-banner'),
        fetch('https://diplom-lpv5.onrender.com/api/content/debit-card-benefits')
      ]);
      
      const banner = await bannerRes.json();
      const benefitsData = await benefitsRes.json();
      
      setBannerData(banner);
      setBenefits(benefitsData);
    } catch (error) {
      console.error('Failed to fetch:', error);
      // Данные по умолчанию с правильными путями
      setBannerData({
        title: 'Дебетовая карта от ЧБ Банка',
        description: 'Бесплатное обслуживание навсегда',
        button_text: 'Оформить карту',
        button_link: '#order-form',
        image_url: '/images/DebitCardimgBanner.png',
        is_active: true
      });
      setBenefits([
        { id: 1, title: 'Кэшбэк до 30%', image_url: '/images/BenefitOneimgWallet.svg', is_active: true },
        { id: 2, title: 'Бесплатное снятие наличных', image_url: '/images/BenefittwoimgCoin.svg', is_active: true },
        { id: 3, title: 'Бесплатное обслуживание', image_url: '/images/Benefitthreeimgshield.svg', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    // Проверяем, есть ли элемент формы на текущей странице
    const formElement = document.getElementById('order-form');
    if (formElement) {
      // Если форма есть на странице - скроллим к ней
      formElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // Если формы нет - переходим на страницу с формой
      navigate('/debit-card#order-form');
      setTimeout(() => {
        const element = document.getElementById('order-form');
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 500);
    }
  };

  if (loading) return <div className={s.debitbanner}>Загрузка...</div>;
  
  // Если баннер не активен - не показываем
  if (!bannerData || bannerData.is_active === false) return null;

  // Формируем URL изображения баннера с fallback
  const bannerImageUrl = bannerData.image_url || '/images/DebitCardimgBanner.png';

  return (
    <>
      <div className={s.debitbanner}>
        <div className={s.debitbanner__box}>
          <div className={s.debitbanner__text}>
            <h2 className={s.debitbanner__title}>{bannerData.title}</h2>
            <p className={s.debitbanner__desc}>{bannerData.description}</p>

            <div className={s.debitbanner__btnbox}>
              <button className={s.debitbanner__btn} onClick={scrollToForm}>
                {bannerData.button_text}
              </button>
            </div>
          </div>

          <div className={s.debitbanner__imgbox}>
            <img 
              src={bannerImageUrl} 
              alt="Debit Card"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/DebitCardimgBanner.png';
              }}
            />
          </div>

          <div className={s.debitbanner__benefits}>
            {benefits.filter(b => b.is_active !== false).map((benefit) => (
              <Benefit key={benefit.id} title={benefit.title} imageSrc={benefit.image_url} />
            ))}
          </div>
        </div>
      </div>

      {/* Якорь для формы */}
      <div ref={formRef} id="order-form" className={s.formAnchor}></div>
    </>
  );
};

export default DebitCardBanner;
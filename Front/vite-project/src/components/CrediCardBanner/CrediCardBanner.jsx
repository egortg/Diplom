import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import s from "./creditcardbanner.module.scss";

const Benefit = ({ title, imageSrc }) => {
  return (
    <div className={s.creditbanner__benefit}>
      <div className={s.creditbanner__benefittext}>
        <h3 className={s.creditbanner__benefittitle}>{title}</h3>
      </div>
      <div className={s.creditbanner__benefitimgbox}>
        <img  className={s.creditbanner__benefitimage}src={imageSrc} alt={title} />
      </div>
    </div>
  );
};

const CreditCardBanner = () => {
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
        fetch('https://diplom-lpv5.onrender.com/api/content/credit-card-banner'),
        fetch('https://diplom-lpv5.onrender.com/api/content/credit-card-benefits')
      ]);
      
      const banner = await bannerRes.json();
      const benefitsData = await benefitsRes.json();
      
      setBannerData(banner);
      setBenefits(benefitsData);
    } catch (error) {
      console.error('Failed to fetch:', error);
      // Данные по умолчанию
      setBannerData({
        title: 'Кредитная Карта от ЧБ Банка',
        description: '100 дней без процентов на всё',
        button_text: 'Оформить карту',
        button_link: '#credit-order-form',
        image_url: '/images/CreditCardimgBanner.png',
        is_active: true
      });
      setBenefits([
        { id: 1, title: 'Кэшбэк до 30%', image_url: '/images/CreditCardBenefitdiscount.svg', is_active: true },
        { id: 2, title: 'Бесплатное снятие наличных', image_url: '/images/BenefittwoimgCoin.svg', is_active: true },
        { id: 3, title: 'Бесплатное обслуживание', image_url: '/images/Benefitthreeimgshield.svg', is_active: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    // Проверяем, есть ли элемент формы на текущей странице
    const formElement = document.getElementById('credit-order-form');
    if (formElement) {
      // Если форма есть на странице - скроллим к ней
      formElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // Если формы нет - переходим на страницу с формой
      navigate('/credit-card#credit-order-form');
      setTimeout(() => {
        const element = document.getElementById('credit-order-form');
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 500);
    }
  };

  if (loading) return <div className={s.creditbanner}>Загрузка...</div>;
  
  // Если баннер не активен - не показываем
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
            <img src={bannerData.image_url} alt="Credit Card" />
          </div>

          <div className={s.creditbanner__benefits}>
            {benefits.filter(b => b.is_active !== false).map((benefit) => (
              <Benefit key={benefit.id} title={benefit.title} imageSrc={benefit.image_url} />
            ))}
          </div>
        </div>
      </div>

      {/* Якорь для формы */}
      <div ref={formRef} id="credit-order-form" className={s.formAnchor}></div>
    </>
  );
};

export default CreditCardBanner;
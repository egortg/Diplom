import { useState, useEffect } from "react";
import s from "./creditform.module.scss";

const CreditForm = () => {
  const [formData, setFormData] = useState({
    creditLimit: "",
    term: "",
    creditPurpose: "",
    fullName: "",
    phone: "",
    email: "",
    agreement: false,
    marketingAgreement: false,
  });
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    try {
      const response = await fetch('https://diplom-lpv5.onrender.com/api/content/credit-form');
      const data = await response.json();
      setFormConfig(data);
    } catch (error) {
      console.error('Failed to fetch form:', error);
      setFormConfig({
        title: 'Заявка на Кредит',
        button_text: 'Отправить заявку',
        fields: [
          { name: 'creditLimit', type: 'text', placeholder: 'Желаемый кредитный лимит (не более 1 млн рублей)', required: true },
          { name: 'term', type: 'text', placeholder: 'Срок', required: true },
          { name: 'creditPurpose', type: 'text', placeholder: 'Цель Кредита', required: true },
          { name: 'fullName', type: 'text', placeholder: 'Фамилия Имя Отчество', required: true },
          { name: 'phone', type: 'tel', placeholder: 'Мобильный телефон', required: true },
          { name: 'email', type: 'email', placeholder: 'Электронная почта', required: true }
        ],
        agreements: [
          { id: 1, text: 'Я соглашаюсь с условиями и даю своё согласие на обработку и использование моих персональных данных, и разрешаю сделать запрос в бюро кредитных историй', required: true },
          { id: 2, text: 'Я даю согласие на получение рекламы, а также иной информации и предложений Банка и других рекламораспространителей по любым каналам связи', required: false }
        ],
        is_active: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form data:", formData);
  };

  if (loading) return <div>Загрузка...</div>;
  if (!formConfig || formConfig.is_active === false) return null;

  return (
    <div className={s.creditform}>
      <div className={s.creditform__box}>
        <h2 className={s.creditform__title}>{formConfig.title}</h2>

        <form className={s.creditform__formbox} onSubmit={handleSubmit}>
          <h3 key="sum-title" className={s.creditform__subtitle}>Сумма и срок</h3>

          {formConfig.fields?.map((field, index) => {
            if (field.name === 'fullName') {
              return (
                <div key="contact-title">
                  <h3 className={s.creditform__subtitle}>Контактные данные</h3>
                  <input
                    key={field.name}
                    className={s.creditform__input}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                  />
                </div>
              );
            } else if (field.name === 'phone') {
              return (
                <div key="phone-email" className={s.creditform__inputsbox}>
                  <input
                    key={`${field.name}-input`}
                    className={s.creditform__inputinbox}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                  />
                  {formConfig.fields[index + 1] && (
                    <input
                      key={formConfig.fields[index + 1].name}
                      className={s.creditform__inputinbox}
                      type={formConfig.fields[index + 1].type}
                      name={formConfig.fields[index + 1].name}
                      placeholder={formConfig.fields[index + 1].placeholder}
                      value={formData[formConfig.fields[index + 1].name]}
                      onChange={handleChange}
                      required={formConfig.fields[index + 1].required}
                    />
                  )}
                </div>
              );
            } else if (field.name !== 'email') {
              return (
                <input
                  key={field.name}
                  className={s.creditform__input}
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                />
              );
            }
            return null;
          })}

          {formConfig.agreements?.map((agreement) => (
            <div key={agreement.id} className={s.creditform__radiobox}>
              <label className={s.custom_radio}>
                <input
                  className={s.creditform__radiobtn}
                  type="checkbox"
                  name={agreement.id === 1 ? "agreement" : "marketingAgreement"}
                  checked={agreement.id === 1 ? formData.agreement : formData.marketingAgreement}
                  onChange={handleChange}
                />
                <span className={s.radio_mark}></span>
                <h5>{agreement.text}</h5>
              </label>
            </div>
          ))}

          <div key="submit-btn" className={s.creditform__btnbox}>
            <button type="submit" className={s.creditform__btn}>
              {formConfig.button_text}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditForm;
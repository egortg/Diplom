import { useState, useEffect } from 'react';
import s from "./creditcardform.module.scss";

const CreditCardForm = () => {
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formValues, setFormValues] = useState({});
    const [agreements, setAgreements] = useState({});

    useEffect(() => {
        fetchForm();
    }, []);

    const fetchForm = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/content/credit-card-form');
            const data = await response.json();
            
            // Если форма не активна - не загружаем данные
            if (data && data.is_active === false) {
                setFormData(null);
                setLoading(false);
                return;
            }
            
            setFormData(data);
            const initialValues = {};
            data.fields?.forEach(field => { initialValues[field.name] = ''; });
            setFormValues(initialValues);
            const initialAgreements = {};
            data.agreements?.forEach(ag => { initialAgreements[ag.id] = false; });
            setAgreements(initialAgreements);
        } catch (error) {
            console.error('Failed to fetch form:', error);
            setFormData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (name, value) => {
        setFormValues(prev => ({ ...prev, [name]: value }));
    };

    const handleAgreementChange = (id, checked) => {
        setAgreements(prev => ({ ...prev, [id]: checked }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', { ...formValues, agreements });
    };

    // Показываем индикатор загрузки
    if (loading) return <div className={s.loading}>Загрузка...</div>;
    
    // Если форма не активна или данных нет - НЕ ПОКАЗЫВАЕМ форму
    if (!formData || formData.is_active === false) {
        return null;
    }

    return (
        <div className={s.creditcardform}>
            <div className={s.creditcardform__box}>
                <h2 className={s.creditcardform__title}>{formData.title}</h2>
                <form className={s.creditcardform__formbox} onSubmit={handleSubmit}>
                    {formData.fields?.map((field, index) => {
                        if (index === 2) {
                            return (
                                <div key={field.name} className={s.creditcardform__inputsbox}>
                                    <input
                                        className={s.creditcardform__inputinbox}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        value={formValues[field.name] || ''}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        required={field.required}
                                    />
                                    {formData.fields[index + 1] && (
                                        <input
                                            key={formData.fields[index + 1].name}
                                            className={s.creditcardform__inputinbox}
                                            type={formData.fields[index + 1].type}
                                            placeholder={formData.fields[index + 1].placeholder}
                                            value={formValues[formData.fields[index + 1].name] || ''}
                                            onChange={(e) => handleInputChange(formData.fields[index + 1].name, e.target.value)}
                                            required={formData.fields[index + 1].required}
                                        />
                                    )}
                                </div>
                            );
                        } else if (index !== 3) {
                            return (
                                <input
                                    key={field.name}
                                    className={s.creditcardform__input}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    value={formValues[field.name] || ''}
                                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    required={field.required}
                                />
                            );
                        }
                        return null;
                    })}

                    {formData.agreements?.map((agreement) => (
                        <div key={agreement.id} className={s.creditcardform__radiobox}>
                            <label className={s.custom_radio}>
                                <input
                                    className={s.creditcardform__radiobtn}
                                    type="checkbox"
                                    checked={agreements[agreement.id] || false}
                                    onChange={(e) => handleAgreementChange(agreement.id, e.target.checked)}
                                />
                                <span className={s.radio_mark}></span>
                                <h5>{agreement.text}</h5>
                            </label>
                        </div>
                    ))}

                    <div className={s.creditcardform__btnbox}>
                        <button type="submit" className={s.creditcardform__btn}>
                            {formData.button_text}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreditCardForm;
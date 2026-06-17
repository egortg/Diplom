import { useState, useEffect } from 'react';
import s from "./debitcardform.module.scss";

const DebitCardForm = () => {
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForm();
    }, []);

    const fetchForm = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/content/debit-card-form');
            const data = await response.json();
            
            // Если форма не активна - не загружаем данные
            if (data && data.is_active === false) {
                setFormData(null);
                setLoading(false);
                return;
            }
            
            setFormData(data);
        } catch (error) {
            console.error('Failed to fetch form:', error);
            setFormData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formValues = {
            fullName: e.target.fullName?.value,
            birthDate: e.target.birthDate?.value,
            phone: e.target.phone?.value,
            email: e.target.email?.value
        };
        console.log('Form submitted:', formValues);
    };

    // Показываем индикатор загрузки
    if (loading) return <div className={s.loading}>Загрузка...</div>;
    
    // Если форма не активна или данных нет - НЕ ПОКАЗЫВАЕМ форму
    if (!formData || formData.is_active === false) {
        return null;
    }

    return (
        <div className={s.debitcardform}>
            <div className={s.debitcardform__text}>
                <h2 className={s.debitcardform__title}>{formData.title}</h2>
            </div>
            <div className={s.debitcardform__box}>
                <form className={s.debitcardform__formbox} onSubmit={handleSubmit}>
                    <input
                        className={s.debitcardform__input}
                        type="text"
                        name="fullName"
                        placeholder="Фамилия Имя Отчество"
                        required
                    />
                    <input
                        className={s.debitcardform__input}
                        type="date"
                        name="birthDate"
                        placeholder="Дата рождения"
                        required
                    />
                    <div className={s.debitcardform__inputsbox}>
                        <input
                            className={s.debitcardform__inputinbox}
                            type="tel"
                            name="phone"
                            placeholder="Мобильный телефон"
                            required
                        />
                        <input
                            className={s.debitcardform__inputinbox}
                            type="email"
                            name="email"
                            placeholder="Электронная почта"
                            required
                        />
                    </div>

                    <div className={s.debitcardform__btnbox}>
                        <button type="submit" className={s.debitcardform__btn}>
                            {formData.button_text}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DebitCardForm;
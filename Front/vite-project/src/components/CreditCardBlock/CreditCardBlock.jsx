import { useState, useEffect } from 'react';
import s from "./creditcardblock.module.scss";

const CreditCardBlock = () => {
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSteps();
    }, []);

    const fetchSteps = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/content/credit-card-steps');
            const data = await response.json();
            setSteps(data);
        } catch (error) {
            console.error('Failed to fetch steps:', error);
            setSteps([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className={s.creditblock}>Загрузка...</div>;
    
    // Если нет шагов или все шаги неактивны - не показываем блок
    const activeSteps = steps.filter(step => step.is_active !== false);
    if (activeSteps.length === 0) return null;

    return (
        <div className={s.creditblock}>
            <div className={s.creditblock__box}>
                <h2 className={s.creditblock__title}>Оформите Кредитную карту за 5 минут</h2>
                <div className={s.creditblock__itemsbox}>
                    {activeSteps.map((step) => (
                        <div key={step.id} className={s.creditblock__itembox}>
                            <div className={s.creditblock__itemiconbox}>
                                <h4 className={s.creditblock__itemicon}>{step.icon || step.id}</h4>
                            </div>
                            <h3 className={s.creditblock__itemtitle}>{step.title}</h3>
                            <p className={s.creditblock__itemdesc}>{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CreditCardBlock;
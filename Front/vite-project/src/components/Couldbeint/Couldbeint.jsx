import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import s from "./couldbeint.module.scss";
import BlockoneimgCard from "../../../images/BlockoneimgCard.png";
import BlocktwoimgCard from "../../../images/BlocktwoimgCard.png";
import BlockthreeimgMoney from "../../../images/BlockthreeimgMoney.png";
import Blockfourimgvault from "../../../images/Blockfourimgvault.png";

// Компонент карточки
const Card = ({ title, description, imageSrc, link, className }) => {
  const CardContent = () => (
    <>
      <div className={s.couldbeint__text}>
        <h3 className={s.couldbeint__title}>{title}</h3>
        <p className={s.couldbeint__desc}>{description}</p>
      </div>
      <div className={s.couldbeint__imgbox}>
        <img className={s.couldbeint__img} src={imageSrc} alt={title} />
      </div>
    </>
  );

  if (link) {
    return (
      <div className={className} onClick={() => window.location.href = link}>
        <CardContent />
      </div>
    );
  }

  return (
    <div className={className}>
      <CardContent />
    </div>
  );
};

const Couldbeint = () => {
  const location = useLocation();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Проверяем, находится ли пользователь на странице админ-панели
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Если это админ-маршрут - не загружаем данные
    if (!isAdminRoute) {
      fetchBlocks();
    } else {
      setLoading(false);
    }
  }, [isAdminRoute]);

  const fetchBlocks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/content/interest-blocks');
      const data = await response.json();
      setBlocks(data);
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
      // Данные по умолчанию, если сервер не доступен
      setBlocks([
        { id: 1, title: 'Дебетовая карта', description: 'Кэшбэк до 30%', image_url: BlockoneimgCard, link: '/debit-card', block_type: 'debit_card' },
        { id: 2, title: 'Кредитная карта', description: 'Обслуживание 0 ₽', image_url: BlocktwoimgCard, link: '/credit-card', block_type: 'credit_card' },
        { id: 3, title: 'Кредит', description: 'Оформление онлайн', image_url: BlockthreeimgMoney, link: '/credit', block_type: 'credit' },
        { id: 4, title: 'Сберегательный вклад', description: 'До 14,5% годовых', image_url: Blockfourimgvault, link: '/deposit', block_type: 'deposit' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getBlockClassName = (blockType) => {
    switch (blockType) {
      case 'debit_card': return s.couldbeint__blockone;
      case 'credit_card': return s.couldbeint__blocktwo;
      case 'credit': return s.couldbeint__blockthree;
      case 'deposit': return s.couldbeint__blockfour;
      default: return s.couldbeint__blockone;
    }
  };

  // Если это админ-маршрут - не показываем блок
  if (isAdminRoute) {
    return null;
  }

  if (loading) {
    return (
      <div className={s.couldbeint}>
        <div className={s.couldbeint__box}>
          <div className={s.couldbeint__heading}>
            <h2 className={s.couldbeint__h2}>Вас могут заинтересовать</h2>
          </div>
          <div className={s.loading}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={s.couldbeint}>
      <div className={s.couldbeint__box}>
        <div className={s.couldbeint__heading}>
          <h2 className={s.couldbeint__h2}>Вас могут заинтересовать</h2>
        </div>

        <div className={s.couldbeint__blocksbox}>
          {blocks.map((block) => (
            <Card
              key={block.id}
              title={block.title}
              description={block.description}
              imageSrc={block.image_url}
              link={block.link}
              className={getBlockClassName(block.block_type)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Couldbeint;
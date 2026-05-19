import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import s from './Auth.module.scss';

const LoginForm = ({ onSwitchToRegister, onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(identifier, password);
    
    if (result.success) {
      if (onClose) onClose();
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className={s.authModal}>
      <div className={s.authContent}>
        <button className={s.closeBtn} onClick={onClose}>×</button>
        <h2>Вход в личный кабинет</h2>
        
        {error && <div className={s.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label>Email или номер телефона</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder="example@mail.com или +7XXXXXXXXXX"
            />
          </div>
          
          <div className={s.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <p className={s.switchText}>
          Нет аккаунта?{' '}
          <button onClick={onSwitchToRegister} className={s.switchBtn}>
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
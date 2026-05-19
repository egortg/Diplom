import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import s from './Auth.module.scss';

const RegisterForm = ({ onSwitchToLogin, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
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
        <h2>Регистрация</h2>
        
        {error && <div className={s.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={s.formGroup}>
            <label>ФИО</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder="Иванов Иван Иванович"
            />
          </div>
          
          <div className={s.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@mail.com"
            />
          </div>
          
          <div className={s.formGroup}>
            <label>Номер телефона</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+7XXXXXXXXXX"
            />
          </div>
          
          <div className={s.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          
          <div className={s.formGroup}>
            <label>Подтверждение пароля</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <p className={s.switchText}>
          Уже есть аккаунт?{' '}
          <button onClick={onSwitchToLogin} className={s.switchBtn}>
            Войти
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
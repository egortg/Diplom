import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import s from './AdminLogin.module.scss';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('https://diplom-lpv5.onrender.com/api/admin/login', {
                email,
                password
            });

            localStorage.setItem('adminToken', response.data.token);
            localStorage.setItem('adminData', JSON.stringify(response.data.admin));
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Неверный email или пароль');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToHome = () => {
        navigate('/');
    };

    return (
        <div className={s.adminLogin}>
            <div className={s.loginBox}>
                <button onClick={handleGoToHome} className={s.backToHomeBtn}>
                    ← На главную
                </button>
                <h1>ЧБ Банк</h1>
                <h2>Вход в админ-панель</h2>
                
                {error && <div className={s.error}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className={s.formGroup}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@bank.com"
                            required
                        />
                    </div>
                    
                    <div className={s.formGroup}>
                        <label>Пароль</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••"
                            required
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className={s.submitBtn}>
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
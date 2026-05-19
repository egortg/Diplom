import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import s from './UserManager.module.scss';

const UsersManager = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/admin/dashboard');
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );

    if (loading) return <div className={s.loading}>Загрузка...</div>;

    return (
        <div className={s.manager}>
            <div className={s.header}>
                <button onClick={handleBackToDashboard} className={s.backBtn}>
                    ← Назад к дашборду
                </button>
                <h2>Управление пользователями</h2>
                <input
                    type="text"
                    className={s.searchInput}
                    placeholder="Поиск по email, имени или телефону..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <table className={s.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ФИО</th>
                        <th>Email</th>
                        <th>Телефон</th>
                        <th>Дата регистрации</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.fullName || '—'}</td>
                            <td>{user.email}</td>
                            <td>{user.phone || '—'}</td>
                            <td>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
                <div className={s.emptyState}>Пользователи не найдены</div>
            )}
        </div>
    );
};

export default UsersManager;
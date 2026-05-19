import { useState, useEffect } from "react";
import { useNavigate, Outlet, Link } from "react-router-dom";
import axios from "axios";
import s from "./Admin.module.scss";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    banners: 0,
    benefits: 0,
    interestBlocks: 0,
  });
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/admin/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        navigate("/admin/login");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin/login");
  };

  return (
    <div className={s.adminLayout}>
      <aside className={s.sidebar}>
        <div className={s.logo}>
          <p>Админ-панель</p>
        </div>

        <nav className={s.nav}>
          <div className={s.homepage}>
            <Link to="/admin/homepage" className={s.navLink}>
              Главная Страница
            </Link>
            <Link to="/admin/debit-card-page" className={s.navLink}>
              Дебетовая карта
            </Link>
            <Link to="/admin/credit-card-page" className={s.navLink}>
              Кредитная карта
            </Link>
            <Link to="/admin/credit-page" className={s.navLink}>
              Кредит
            </Link>
          </div>
          <br />
          <Link to="/admin/users" className={s.navLink}>
            Пользователи
          </Link>
        </nav>

        <div className={s.userInfo}>
          <p>{adminData.fullName || "Администратор"}</p>
          <button onClick={handleLogout} className={s.logoutBtn}>
            Выйти
          </button>
        </div>
      </aside>

      <main className={s.mainContent}>
        <div className={s.statsGrid}>
          <div className={s.statCard}>
            <h3>Пользователи</h3>
            <p className={s.statNumber}>{stats.users}</p>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;

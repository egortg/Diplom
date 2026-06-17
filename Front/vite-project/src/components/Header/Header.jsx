import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../Auth/LoginForm';
import RegisterForm from '../Auth/RegisterForm';
import s from "./header.module.scss";
import Logo from "../../assets/images/Logo.svg";
import { Link } from "react-router";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  
  const isAdminRoute = location.pathname.startsWith('/admin');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? "hidden" : "";
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = "";
  };

  const handleLoginClick = () => {
    setShowLogin(true);
    closeMenu();
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    closeMenu();
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  
  if (isAdminRoute) {
    return null;
  }

  return (
    <>
      <div className={s.header}>
        <div className={s.header__box}>
          <div className={s.header__navbar}>
            <div className={s.header__logo}>
              <Link to="/" onClick={closeMenu}>
                <img src={Logo} alt="Logo" />
              </Link>
            </div>

            <button 
              className={`${s.header__burger} ${isMenuOpen ? s.active : ""}`} 
              onClick={toggleMenu}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <ul className={`${s.header__links} ${isMenuOpen ? s.active : ""}`}>
              <li>
                <Link className={s.header__link} to="/debit-card" onClick={closeMenu}>
                  Дебетовая карта
                </Link>
              </li>
              <li>
                <Link className={s.header__link} to="/credit-card" onClick={closeMenu}>
                  Кредитная карта
                </Link>
              </li>
              <li>
                <Link className={s.header__link} to="/credit" onClick={closeMenu}>
                  Кредит
                </Link>
              </li>
            </ul>
          </div>

         
            {isAuthenticated ? (
              <div className={s.userMenu}>
                <span className={s.userName}>{user?.fullName}</span>
                <button className={s.header__btn} onClick={handleLogout}>
                  Выйти
                </button>
              </div>
            ) : (
              <div className={s.header__btnbox}>
              <button className={s.header__btn} onClick={handleLoginClick}>
                Войти
              </button>
              </div>
            )}
          
        </div>

        <div className={`${s.header__overlay} ${isMenuOpen ? s.active : ""}`} onClick={closeMenu}></div>
      </div>

      {showLogin && (
        <LoginForm 
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <RegisterForm 
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </>
  );
};

export default Header;
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaStore, FaCog, FaChevronDown, FaMapMarkerAlt, FaHeart, FaBalanceScale, FaArrowRight, FaThLarge } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { user, isAuthenticated, isAdmin, isSeller, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const categoriesRef = useRef(null);

  const categories = [
    { name: 'Electrónica', icon: '📱', link: '/products?category=electronics' },
    { name: 'Moda', icon: '👕', link: '/products?category=fashion' },
    { name: 'Hogar', icon: '🏠', link: '/products?category=home' },
    { name: 'Supermercado', icon: '🛒', link: '/products?category=supermarket' },
    { name: 'Deportes', icon: '⚽', link: '/products?category=sports' },
    { name: 'Belleza', icon: '💄', link: '/products?category=beauty' },
    { name: 'Juguetes', icon: '🧸', link: '/products?category=toys' },
    { name: 'Automóvil', icon: '🚗', link: '/products?category=auto' },
  ];

  const quickLinks = [
    { name: 'Ofertas', link: '/products?featured=true' },
    { name: 'Historial', link: '/history' },
    { name: 'Vender', link: isSeller ? '/seller' : '/register' },
    { name: 'Ayuda', link: '/help' },
  ];

  const getFavoritesCount = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.length;
  };

  const getCompareCount = () => {
    const compare = JSON.parse(localStorage.getItem('compareProducts') || '[]');
    return compare.length;
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get(`/api/products?search=${searchQuery}&limit=6`);
        setSuggestions(response.data.products || []);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setIsCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (productId, productName) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(`/products/${productId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar-fusion">
      {/* Top Bar - Logo & Search */}
      <div className="navbar-top">
        <div className="navbar-container-top">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🛒</span>
            <span className="logo-text">MarketLux</span>
          </Link>

          <form className="navbar-search" onSubmit={handleSearch} ref={searchRef}>
            <input
              type="text"
              placeholder="Buscar productos, marcas y más..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
            <div className="search-divider"></div>
            <button type="submit">
              <FaSearch />
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(product.id, product.name)}
                  >
                    <img src={product.images?.[0]} alt={product.name} />
                    <div className="suggestion-info">
                      <span className="suggestion-name">{product.name}</span>
                      <span className="suggestion-price">${product.price.toLocaleString()}</span>
                    </div>
                  </button>
                ))}
                <Link to={`/products?search=${searchQuery}`} className="see-all-results">
                  Ver todos los resultados para "{searchQuery}"
                </Link>
              </div>
            )}
          </form>

          <Link to="/products?discount=true" className="navbar-promo-header">
            <span className="promo-badge">🚀</span>
            <span className="promo-text">¡Envío gratis desde $50!</span>
          </Link>
        </div>
      </div>

      {/* Main Bar - Location & Navigation */}
      <div className="navbar-main">
        <div className="navbar-container-main">
          {/* Location */}
          <div className="navbar-location">
            <FaMapMarkerAlt />
            <div className="location-text">
              <span className="label">Enviar a</span>
              <span className="value">San Francisco, CA</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-links-desktop">
            {/* Categories Dropdown */}
            <div className="nav-item categories-wrapper" ref={categoriesRef}>
              <button 
                className="nav-link-main"
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              >
                <FaThLarge />
                <span>Categorías</span>
                <FaChevronDown className={`chevron ${isCategoriesOpen ? 'rotate' : ''}`} />
              </button>
              {isCategoriesOpen && (
                <div className="categories-dropdown">
                  <div className="categories-grid">
                    {categories.map((cat, idx) => (
                      <Link 
                        key={idx} 
                        to={cat.link} 
                        className="category-item"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <span className="category-icon">{cat.icon}</span>
                        <span className="category-name">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                  <Link to="/products" className="see-all-categories" onClick={() => setIsCategoriesOpen(false)}>
                    Ver todas las categorías <FaArrowRight />
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Links */}
            {quickLinks.map((item, idx) => (
              <Link key={idx} to={item.link} className="nav-link-main">
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth & Cart Section */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                <div className="nav-dropdown-user">
                  <button className="nav-link-user">
                    <FaUser />
                    <span className="user-name">{user?.name?.split(' ')[0]}</span>
                    <FaChevronDown />
                  </button>
                  <div className="dropdown-menu-user">
                    <div className="user-greeting">
                      <span>Hola, {user?.name}</span>
                    </div>
                    <Link to="/dashboard">Mi Panel</Link>
                    <Link to="/profile">Mi Perfil</Link>
                    <Link to="/orders">Mis Compras</Link>
                    <Link to="/favorites">
                      <FaHeart /> Favoritos {getFavoritesCount() > 0 && `(${getFavoritesCount()})`}
                    </Link>
                    <Link to="/compare">
                      <FaBalanceScale /> Comparar {getCompareCount() > 0 && `(${getCompareCount()})`}
                    </Link>
                    {isSeller && <Link to="/seller"><FaStore /> Panel Vendedor</Link>}
                    {isAdmin && <Link to="/admin"><FaCog /> Panel Admin</Link>}
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
                  </div>
                </div>
                <Link to="/cart" className="nav-link-cart">
                  <div className="cart-icon-wrapper">
                    <FaShoppingCart />
                    {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
                  </div>
                  <span className="cart-label">Carrito</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/favorites" className="nav-icon-link" title="Favoritos">
                  <FaHeart />
                  {getFavoritesCount() > 0 && <span className="icon-badge">{getFavoritesCount()}</span>}
                </Link>
                <Link to="/compare" className="nav-icon-link" title="Comparar">
                  <FaBalanceScale />
                  {getCompareCount() > 0 && <span className="icon-badge">{getCompareCount()}</span>}
                </Link>
                <div className="auth-buttons">
                  <Link to="/login" className="btn-login">
                    Inicia Sesión
                  </Link>
                  <Link to="/register" className="btn-register">
                    Crea tu cuenta
                  </Link>
                </div>
                <Link to="/cart" className="nav-link-cart-guest">
                  <div className="cart-icon-wrapper">
                    <FaShoppingCart />
                    {getCartCount() > 0 && <span className="cart-badge">{getCartCount()}</span>}
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="navbar-toggle-fusion" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          {/* Location */}
          <div className="mobile-location">
            <FaMapMarkerAlt />
            <span>San Francisco, CA</span>
            <button className="change-location">Cambiar</button>
          </div>

          {/* Categories */}
          <div className="mobile-section">
            <h4>Categorías</h4>
            <div className="mobile-categories-grid">
              {categories.map((cat, idx) => (
                <Link 
                  key={idx} 
                  to={cat.link} 
                  className="mobile-category-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="mobile-section">
            <h4>Navegación</h4>
            {quickLinks.map((item, idx) => (
              <Link 
                key={idx} 
                to={item.link} 
                className="mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="mobile-section">
            <h4>Cuenta</h4>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Mi Panel</Link>
                <Link to="/profile" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
                <Link to="/orders" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Mis Compras</Link>
                <Link to="/favorites" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Favoritos</Link>
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mobile-link logout">
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Inicia Sesión</Link>
                <Link to="/register" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Crea tu cuenta</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

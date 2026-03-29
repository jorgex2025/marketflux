import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { FaClock, FaTruck, FaShieldAlt, FaUndo, FaHeadset, FaArrowRight } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [lightningDeals, setLightningDeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/products?limit=12&featured=true'),
          axios.get('/api/categories'),
        ]);
        
        const allProducts = productsRes.data.products || [];
        setFeaturedProducts(allProducts.slice(4)); // Remaining products
        setLightningDeals(allProducts.slice(0, 4)); // First 4 as lightning deals
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Countdown logic for Lightning Deals
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay - now;

      setTimeLeft({
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-fusion">
      {/* Hero Section - ML Style */}
      <section className="hero-fusion">
        <div className="hero-fusion-container">
          <div className="hero-fusion-content">
            <span className="hero-tag">OFERTAS DE TEMPORADA</span>
            <h1>Encuentra lo que buscas, <br/>al mejor precio</h1>
            <p>Envíos gratis en millones de productos seleccionados</p>
            <Link to="/products" className="hero-fusion-btn">
              Explorar Catálogo <FaArrowRight />
            </Link>
          </div>
          <div className="hero-fusion-image">
            {/* Espacio para una imagen principal opcional */}
          </div>
        </div>
      </section>

      {/* Categorías Bubbles - ALI Style */}
      <section className="categories-bubbles section-fade-in">
        <div className="container">
          <div className="bubbles-wrapper">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="bubble-item"
              >
                <div className="bubble-icon-wrapper">
                  <span className="bubble-icon">{category.icon || '📦'}</span>
                </div>
                <span className="bubble-name">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ofertas Relámpago - ALI Urgency */}
      <section className="lightning-deals section-fade-in">
        <div className="container">
          <div className="lightning-header">
            <div className="lightning-title">
              <h2>Ofertas Relámpago</h2>
              <div className="countdown-timer">
                <FaClock />
                <span>Termina en:</span>
                <div className="timer-units">
                  <span className="unit">{timeLeft.hours.toString().padStart(2, '0')}</span>:
                  <span className="unit">{timeLeft.minutes.toString().padStart(2, '0')}</span>:
                  <span className="unit">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>
            <Link to="/products" className="view-more-link">Ver todas →</Link>
          </div>
          <div className="lightning-grid">
            {lightningDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Banner Publicitario - Professional Wrap */}
      <section className="promo-fusion-banner">
        <div className="container">
          <div className="promo-fusion-card glass-card">
            <div className="promo-text">
              <span className="promo-label">MERCADO FULL</span>
              <h2>¿Quieres vender con nosotros?</h2>
              <p>Llega a millones de compradores y haz crecer tu negocio hoy mismo.</p>
              <Link to="/register" className="promo-fusion-btn-white">Crear cuenta de vendedor</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Productos Destacados - ML Style */}
      <section className="featured-fusion section-fade-in">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title-fusion">Basado en tu última visita</h2>
            <Link to="/products" className="view-all-fusion">Ver todo</Link>
          </div>
          <div className="products-grid-fusion">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Features - Professional Grid */}
      <section className="trust-features">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon-box"><FaTruck /></div>
              <div className="trust-info">
                <h3>Envío gratis</h3>
                <p>En miles de productos</p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon-box"><FaShieldAlt /></div>
              <div className="trust-info">
                <h3>Pago seguro</h3>
                <p>100% protegido</p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon-box"><FaUndo /></div>
              <div className="trust-info">
                <h3>Devolución gratis</h3>
                <p>30 días de garantía</p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon-box"><FaHeadset /></div>
              <div className="trust-info">
                <h3>Soporte 24/7</h3>
                <p>Atención inmediata</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


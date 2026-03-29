import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-logo">
            <span className="logo-icon">🛒</span>
            MarketPlace
          </h3>
          <p className="footer-description">
            Tu marketplace de confianza. Encuentra los mejores productos
            con los mejores precios y la mejor calidad.
          </p>
          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>Enlaces Rápidos</h4>
          <ul className="footer-links">
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li>
              <Link to="/products">Productos</Link>
            </li>
            <li>
              <Link to="/products?category=ofertas">Ofertas</Link>
            </li>
            <li>
              <Link to="/products?category=nuevos">Nuevos Productos</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Ayuda</h4>
          <ul className="footer-links">
            <li>
              <Link to="/help">Centro de Ayuda</Link>
            </li>
            <li>
              <Link to="/shipping">Envíos</Link>
            </li>
            <li>
              <Link to="/returns">Devoluciones</Link>
            </li>
            <li>
              <Link to="/faq">Preguntas Frecuentes</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contacto</h4>
          <ul className="footer-contact">
            <li>
              <FaMapMarkerAlt />
              <span>Av. Principal 123, Ciudad</span>
            </li>
            <li>
              <FaPhone />
              <span>+1 234 567 890</span>
            </li>
            <li>
              <FaEnvelope />
              <span>info@marketplace.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>&copy; 2024 MarketPlace. Todos los derechos reservados.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Política de Privacidad</Link>
            <Link to="/terms">Términos y Condiciones</Link>
            <Link to="/cookies">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

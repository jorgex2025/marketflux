import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaShoppingBag, FaClock, FaTruck, FaCheckCircle, FaStar, FaHeart, FaChartLine, FaBox } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
    favoriteCount: 0,
    averageRating: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/orders');
      
      if (response.data.success) {
        const orders = response.data.data;
        
        const pending = orders.filter(o => o.status === 'pending').length;
        const shipped = orders.filter(o => o.status === 'shipped' || o.status === 'processing').length;
        const delivered = orders.filter(o => o.status === 'delivered').length;
        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        
        setStats({
          totalOrders: orders.length,
          pendingOrders: pending,
          shippedOrders: shipped,
          deliveredOrders: delivered,
          totalSpent,
          favoriteCount: JSON.parse(localStorage.getItem('favorites') || '[]').length,
          averageRating: 4.8
        });
        
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock />;
      case 'processing': return <FaBox />;
      case 'shipped': return <FaTruck />;
      case 'delivered': return <FaCheckCircle />;
      default: return <FaShoppingBag />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'processing': return 'processing';
      case 'shipped': return 'shipped';
      case 'delivered': return 'delivered';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="buyer-dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando tu cuenta...</p>
      </div>
    );
  }

  return (
    <div className="buyer-dashboard-page container section-fade-in">
      <header className="buyer-dashboard-header glass-card">
        <div className="buyer-welcome">
          <div className="buyer-avatar">
            <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div>
            <h1>¡Bienvenido, {user?.name}!</h1>
            <p>Gestiona tus compras y favoritos</p>
          </div>
        </div>
        <div className="buyer-level-badge">
          <FaStar />
          <span>Comprador Experto</span>
        </div>
      </header>

      <div className="buyer-stats-grid">
        <div className="buyer-stat-card glass-card">
          <div className="stat-icon blue"><FaShoppingBag /></div>
          <div className="stat-info">
            <h3>{stats.totalOrders}</h3>
            <p>Total de Compras</p>
          </div>
        </div>
        
        <div className="buyer-stat-card glass-card">
          <div className="stat-icon orange"><FaClock /></div>
          <div className="stat-info">
            <h3>{stats.pendingOrders}</h3>
            <p>Pedidos Pendientes</p>
          </div>
        </div>
        
        <div className="buyer-stat-card glass-card">
          <div className="stat-icon green"><FaTruck /></div>
          <div className="stat-info">
            <h3>{stats.shippedOrders}</h3>
            <p>En Camino</p>
          </div>
        </div>
        
        <div className="buyer-stat-card glass-card">
          <div className="stat-icon purple"><FaCheckCircle /></div>
          <div className="stat-info">
            <h3>{stats.deliveredOrders}</h3>
            <p>Entregados</p>
          </div>
        </div>
      </div>

      <div className="buyer-content-grid">
        <div className="buyer-spending-card glass-card">
          <div className="card-header">
            <h3><FaChartLine /> Gastos Totales</h3>
          </div>
          <div className="spending-amount">
            <span className="currency">$</span>
            <span className="amount">{stats.totalSpent.toLocaleString()}</span>
          </div>
          <p className="spending-label">Total invertido en MarketLux</p>
          <div className="spending-bar">
            <div className="bar-fill" style={{ width: `${Math.min(stats.totalSpent / 10000 * 100, 100)}%` }}></div>
          </div>
          <p className="bar-label">Meta: $10,000</p>
        </div>

        <div className="buyer-favorites-card glass-card">
          <div className="card-header">
            <h3><FaHeart /> Favoritos</h3>
            <Link to="/favorites" className="see-all-link">Ver todos</Link>
          </div>
          <div className="favorites-preview">
            <span className="favorites-count">{stats.favoriteCount}</span>
            <p>Productos guardados para más tarde</p>
          </div>
          {stats.favoriteCount > 0 && (
            <Link to="/favorites" className="btn btn-primary">Ver Favoritos</Link>
          )}
        </div>
      </div>

      <section className="recent-orders-section">
        <div className="section-header">
          <h2>Compras Recientes</h2>
          <Link to="/orders" className="view-all-link">Ver todas</Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-orders glass-card">
            <FaShoppingBag />
            <h3>Aún no tienes compras</h3>
            <p>Explora nuestros productos y empieza a comprar</p>
            <Link to="/products" className="btn btn-primary">Explorar</Link>
          </div>
        ) : (
          <div className="recent-orders-list">
            {recentOrders.map(order => (
              <div key={order.id} className="recent-order-card glass-card">
                <div className="order-header">
                  <span className="order-id">#ORD-{order.id.toString().padStart(5, '0')}</span>
                  <span className={`order-status ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </div>
                
                <div className="order-items-preview">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <img key={idx} src={item.image} alt={item.name} />
                  ))}
                  {order.items.length > 3 && (
                    <span className="more-items">+{order.items.length - 3}</span>
                  )}
                </div>
                
                <div className="order-footer">
                  <div className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <div className="order-total">
                    ${order.total.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="quick-actions-section">
        <h2>Acciones Rápidas</h2>
        <div className="quick-actions-grid">
          <Link to="/products" className="quick-action-card glass-card">
            <FaShoppingBag />
            <span>Seguir Comprando</span>
          </Link>
          <Link to="/favorites" className="quick-action-card glass-card">
            <FaHeart />
            <span>Mis Favoritos</span>
          </Link>
          <Link to="/compare" className="quick-action-card glass-card">
            <FaChartLine />
            <span>Comparar Productos</span>
          </Link>
          <Link to="/orders" className="quick-action-card glass-card">
            <FaTruck />
            <span>Mis Pedidos</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
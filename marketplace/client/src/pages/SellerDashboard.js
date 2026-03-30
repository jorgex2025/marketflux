import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBox, FaShoppingCart, FaDollarSign, FaStar, FaPlus, FaEdit, FaTrash, FaEye, FaChartLine, FaStore, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalSales: 0,
    averageRating: 0,
    reviewCount: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        axios.get('/api/sellers/dashboard/stats'),
        axios.get(`/api/sellers/${user.id}/products`),
        axios.get('/api/orders') // Filtered by backend if seller
      ]);
      
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (productsRes.data.success) setProducts(productsRes.data.data || []);
      if (ordersRes.data.success) setOrders(ordersRes.data.data || []);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      toast.error('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto permanentemente?')) return;
    try {
      await axios.delete(`/api/products/${productId}`);
      toast.success('Producto eliminado con éxito');
      fetchDashboardData();
    } catch (error) {
      toast.error('Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <div className="seller-dashboard-loading">
        <div className="spinner-fusion"></div>
        <p>Cargando tu centro de negocios...</p>
      </div>
    );
  }

  return (
    <div className="seller-dashboard-page container section-fade-in">
      {/* Premium Seller Header */}
      <header className="seller-hero-header glass-card">
        <div className="seller-profile-section">
          <div className="seller-avatar-large">
            <FaStore />
          </div>
          <div className="seller-title-group">
            <h1>Panel de Vendedor</h1>
            <div className="seller-meta">
              <span className="store-name">{user?.storeName || 'Mi Tienda MarketLux'}</span>
              <span className="seller-level-badge">Nivel Experto</span>
            </div>
          </div>
        </div>
        <div className="seller-quick-stats">
          <div className="mini-stat">
            <span className="mini-label">Reputación</span>
            <span className="mini-value text-green"><FaStar /> {stats.averageRating}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-label">Ventas totales</span>
            <span className="mini-value">{stats.totalSales}</span>
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="seller-stats-grid">
        <div className="stat-card-fusion revenue">
          <div className="stat-icon-box"><FaDollarSign /></div>
          <div className="stat-content">
            <h3>${stats.totalRevenue.toLocaleString()}</h3>
            <p>Ingresos Totales</p>
          </div>
          <div className="stat-trend positive">+12% vs mes anterior</div>
        </div>

        <div className="stat-card-fusion orders">
          <div className="stat-icon-box"><FaShoppingCart /></div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Pedidos Recibidos</p>
          </div>
          <div className="stat-subtitle">{stats.pendingOrders} pendientes por enviar</div>
        </div>

        <div className="stat-card-fusion products">
          <div className="stat-icon-box"><FaBox /></div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Productos en Catálogo</p>
          </div>
          <div className="stat-subtitle">{stats.activeProducts} activos actualmente</div>
        </div>

        <div className="stat-card-fusion rating">
          <div className="stat-icon-box"><FaChartLine /></div>
          <div className="stat-content">
            <h3>{stats.reviewCount}</h3>
            <p>Opiniones de Clientes</p>
          </div>
          <div className="stat-subtitle">Rating prom: {stats.averageRating}/5</div>
        </div>
      </div>

      {/* Quick Actions Tiles */}
      <section className="seller-actions-section">
        <h2>Gestión Rápida</h2>
        <div className="action-tiles-grid">
          <Link to="/seller/products/new" className="action-tile-card saffron">
            <FaPlus />
            <span>Publicar Producto</span>
          </Link>
          <button onClick={() => setActiveTab('products')} className="action-tile-card">
            <FaEdit />
            <span>Editar Catálogo</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className="action-tile-card">
            <FaClock />
            <span>Gestionar Envíos</span>
          </button>
          <Link to="/profile" className="action-tile-card">
            <FaEye />
            <span>Ver mi Tienda</span>
          </Link>
        </div>
      </section>

      {/* Main Content Tabs */}
      <div className="dashboard-tabs-fusion">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Resumen</button>
        <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>Mis Productos</button>
        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>Ventas y Pedidos</button>
      </div>

      <div className="tab-viewport">
        {activeTab === 'overview' && (
          <div className="tab-pane-fusion">
            <div className="recent-activity-row">
              <div className="activity-card glass-card">
                <div className="card-header-fusion">
                  <h3>Últimas Ventas</h3>
                  <button onClick={() => setActiveTab('orders')} className="view-all-link">Ver todas</button>
                </div>
                {orders.length === 0 ? (
                  <p className="empty-msg">No hay ventas recientes.</p>
                ) : (
                  <div className="compact-list">
                    {orders.slice(0, 4).map(order => (
                      <div key={order.id} className="compact-item">
                        <div className="item-main">
                          <span className="item-id">#ORD-{order.id}</span>
                          <span className="item-price">${order.total.toLocaleString()}</span>
                        </div>
                        <span className={`status-pill ${order.status}`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="activity-card glass-card">
                <div className="card-header-fusion">
                  <h3>Salud de tu Cuenta</h3>
                </div>
                <div className="health-metrics">
                  <div className="metric-row">
                    <span>Reclamos</span>
                    <span className="value text-green">0%</span>
                  </div>
                  <div className="metric-row">
                    <span>Despacho a tiempo</span>
                    <span className="value text-green">100%</span>
                  </div>
                  <div className="metric-row">
                    <span>Cancelaciones</span>
                    <span className="value">2%</span>
                  </div>
                </div>
                <div className="health-footer">
                  <FaCheckCircle /> Sigue así para mantener tu exposición.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="tab-pane-fusion">
            <div className="table-wrapper-fusion glass-card">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Ventas</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td className="product-td">
                        <img src={product.images[0]} alt={product.name} />
                        <div className="td-info">
                          <span className="td-title">{product.name}</span>
                          <span className="td-category">{product.category}</span>
                        </div>
                      </td>
                      <td><span className="td-price">${product.price.toLocaleString()}</span></td>
                      <td><span className={`td-stock ${product.stock < 5 ? 'low' : ''}`}>{product.stock} u.</span></td>
                      <td>{product.sold} vendidos</td>
                      <td><span className={`status-pill ${product.status}`}>{product.status}</span></td>
                      <td>
                        <div className="td-actions">
                          <Link to={`/products/${product.id}`} className="icon-btn" title="Ver"><FaEye /></Link>
                          <Link to={`/seller/products/${product.id}/edit`} className="icon-btn edit" title="Editar"><FaEdit /></Link>
                          <button onClick={() => handleDeleteProduct(product.id)} className="icon-btn delete" title="Eliminar"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="tab-pane-fusion">
            <div className="table-wrapper-fusion glass-card">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Orden ID</th>
                    <th>Fecha</th>
                    <th>Total Item</th>
                    <th>Monto</th>
                    <th>Estado Pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td><span className="td-order-id">#ORD-{order.id.toString().padStart(5, '0')}</span></td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>{order.items.length} productos</td>
                      <td><span className="td-price">${order.total.toLocaleString()}</span></td>
                      <td><span className={`status-pill ${order.paymentStatus}`}>{order.paymentStatus}</span></td>
                      <td>
                        <button className="btn-manage-fusion">Gestionar Envío</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;

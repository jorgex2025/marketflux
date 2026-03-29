import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBox, FaChevronRight, FaRegClock, FaTruck, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/api/orders');
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaRegClock className="status-icon pending" />;
      case 'processing': return <FaBox className="status-icon processing" />;
      case 'shipped': return <FaTruck className="status-icon shipped" />;
      case 'delivered': return <FaCheckCircle className="status-icon delivered" />;
      case 'cancelled': return <FaTimesCircle className="status-icon cancelled" />;
      default: return <FaBox className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    const statuses = {
      pending: 'Pendiente',
      processing: 'Preparando envío',
      shipped: 'En camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado'
    };
    return statuses[status] || status;
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="spinner"></div>
        <p>Cargando tus compras...</p>
      </div>
    );
  }

  return (
    <div className="orders-page container section-fade-in">
      <div className="orders-header">
        <h1>Mis compras</h1>
        <p>Gestiona tus pedidos y revisa el estado de tus envíos</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders glass-card">
          <div className="empty-icon">🛒</div>
          <h2>Aún no tienes compras</h2>
          <p>¡Explora nuestros productos y encuentra lo que buscas!</p>
          <Link to="/products" className="hero-fusion-btn">Ir a comprar</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card-professional">
              <div className="order-card-header">
                <div className="order-main-info">
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </span>
                  <span className="order-id">#ORD-{order.id.padStart(5, '0')}</span>
                </div>
                <div className={`order-status-badge ${order.status}`}>
                  {getStatusIcon(order.status)}
                  <span>{getStatusText(order.status)}</span>
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item-row">
                      <div className="item-thumbnail">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <h3 className="item-name">{item.name}</h3>
                        <p className="item-qty">{item.quantity} unidad{item.quantity > 1 ? 'es' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="order-actions">
                  <div className="order-total-info">
                    <span className="total-label">Total pagado</span>
                    <span className="total-value">${order.total.toLocaleString()}</span>
                  </div>
                  <div className="action-buttons">
                    <Link to={`/products/${order.items[0]?.productId}`} className="btn-secondary-fusion">
                      Volver a comprar
                    </Link>
                    <button className="btn-primary-fusion">
                      Ver detalle <FaChevronRight />
                    </button>
                  </div>
                </div>
              </div>
              
              {order.status === 'delivered' && (
                <div className="order-card-footer">
                  <span className="footer-message">Entregado el {new Date(order.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

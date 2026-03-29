import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUsers, FaBox, FaShoppingCart, FaDollarSign, FaStore, FaChartLine, FaCog, FaEye } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalSellers: 0,
  });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, ordersRes, statsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/orders'),
        axios.get('/api/admin/stats'),
      ]);
      
      setUsers(usersRes.data.users || []);
      setOrders(ordersRes.data.orders || []);
      setStats(statsRes.data || {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalSellers: 0,
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('Rol actualizado');
      fetchDashboardData();
    } catch (error) {
      toast.error('Error al actualizar el rol');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success('Estado actualizado');
      fetchDashboardData();
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Panel de Administración</h1>
          <p>Bienvenido, {user?.name}</p>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon users">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>{stats.totalUsers}</h3>
              <p>Usuarios</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <FaBox />
            </div>
            <div className="stat-info">
              <h3>{stats.totalProducts}</h3>
              <p>Productos</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <FaShoppingCart />
            </div>
            <div className="stat-info">
              <h3>{stats.totalOrders}</h3>
              <p>Pedidos</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon revenue">
              <FaDollarSign />
            </div>
            <div className="stat-info">
              <h3>${stats.totalRevenue.toLocaleString()}</h3>
              <p>Ingresos</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rating">
              <FaStore />
            </div>
            <div className="stat-info">
              <h3>{stats.totalSellers}</h3>
              <p>Vendedores</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Resumen
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Usuarios
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Pedidos
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Configuración
          </button>
        </div>

        {/* Contenido de tabs */}
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="quick-actions">
                <h3>Acciones Rápidas</h3>
                <div className="actions-grid">
                  <Link to="/admin/users" className="action-card">
                    <FaUsers />
                    <span>Gestionar Usuarios</span>
                  </Link>
                  <Link to="/admin/products" className="action-card">
                    <FaBox />
                    <span>Gestionar Productos</span>
                  </Link>
                  <Link to="/admin/orders" className="action-card">
                    <FaShoppingCart />
                    <span>Gestionar Pedidos</span>
                  </Link>
                  <Link to="/admin/analytics" className="action-card">
                    <FaChartLine />
                    <span>Analíticas</span>
                  </Link>
                  <Link to="/admin/settings" className="action-card">
                    <FaCog />
                    <span>Configuración</span>
                  </Link>
                </div>
              </div>

              <div className="recent-orders">
                <h3>Pedidos Recientes</h3>
                {orders.length === 0 ? (
                  <p className="no-data">No hay pedidos recientes</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Vendedor</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td>#{order.id}</td>
                          <td>{order.customerName}</td>
                          <td>{order.sellerName}</td>
                          <td>${order.total.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${order.status}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-tab">
              <h3>Todos los Usuarios</h3>
              {users.length === 0 ? (
                <p className="no-data">No hay usuarios</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Fecha de registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-cell">
                            <img
                              src={user.avatar || 'https://via.placeholder.com/40'}
                              alt={user.name}
                            />
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="role-select"
                          >
                            <option value="user">Usuario</option>
                            <option value="seller">Vendedor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn view">
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-tab">
              <h3>Todos los Pedidos</h3>
              {orders.length === 0 ? (
                <p className="no-data">No hay pedidos</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Vendedor</th>
                      <th>Productos</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customerName}</td>
                        <td>{order.sellerName}</td>
                        <td>{order.items?.length || 0} items</td>
                        <td>${order.total.toLocaleString()}</td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="processing">Procesando</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className="action-btn view">
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <h3>Configuración del Sistema</h3>
              <div className="settings-grid">
                <div className="setting-card">
                  <h4>Configuración General</h4>
                  <p>Ajustes generales del marketplace</p>
                  <button className="btn btn-primary">Configurar</button>
                </div>
                <div className="setting-card">
                  <h4>Métodos de Pago</h4>
                  <p>Configurar opciones de pago</p>
                  <button className="btn btn-primary">Configurar</button>
                </div>
                <div className="setting-card">
                  <h4>Envíos</h4>
                  <p>Configurar opciones de envío</p>
                  <button className="btn btn-primary">Configurar</button>
                </div>
                <div className="setting-card">
                  <h4>Notificaciones</h4>
                  <p>Configurar notificaciones</p>
                  <button className="btn btn-primary">Configurar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

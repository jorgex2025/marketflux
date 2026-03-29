import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaShoppingBag, FaShieldAlt, FaIdCard } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(formData);
    if (result.success) setIsEditing(false);
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-fusion-container container section-fade-in">
      <div className="profile-layout">
        {/* Sidebar - Quick Info */}
        <aside className="profile-sidebar">
          <div className="profile-card-header glass-card">
            <div className="profile-avatar-wrapper">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3483fa&color=fff`}
                alt={user?.name}
                className="profile-main-avatar"
              />
              <button className="edit-avatar-trigger" title="Cambiar foto">
                <FaEdit />
              </button>
            </div>
            <div className="profile-identity">
              <h2>{user?.name}</h2>
              <span className="profile-badge-role">
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'seller' ? 'Vendedor' : 'Comprador Nivel 1'}
              </span>
            </div>
          </div>

          <nav className="profile-nav">
            <Link to="/orders" className="profile-nav-item">
              <FaShoppingBag /> Mis compras
            </Link>
            <Link to="/profile" className="profile-nav-item active">
              <FaUser /> Mis datos
            </Link>
            <Link to="/profile" className="profile-nav-item">
              <FaShieldAlt /> Seguridad
            </Link>
          </nav>
        </aside>

        {/* Main Content - Forms/Info */}
        <main className="profile-main-content">
          <div className="profile-section-card">
            <div className="section-title-row">
              <div className="title-group">
                <FaIdCard className="section-main-icon" />
                <div>
                  <h2>Datos de cuenta</h2>
                  <p>Información básica para tu identificación en MarketLux</p>
                </div>
              </div>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn-edit-fusion">
                  Modificar
                </button>
              ) : (
                <button onClick={handleCancel} className="btn-cancel-fusion">
                  <FaTimes />
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-edit-form">
                <div className="form-grid">
                  <div className="input-group-fusion">
                    <label><FaUser /> Nombre completo</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="input-group-fusion disabled">
                    <label><FaEnvelope /> Email (no editable)</label>
                    <input type="email" value={formData.email} disabled />
                  </div>
                  <div className="input-group-fusion">
                    <label><FaPhone /> Teléfono</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: +52 55..." />
                  </div>
                  <div className="input-group-fusion full-width">
                    <label><FaMapMarkerAlt /> Dirección principal</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows="3" placeholder="Calle, número, colonia..." />
                  </div>
                </div>
                <div className="form-actions-fusion">
                  <button type="submit" className="btn-save-fusion" disabled={loading}>
                    <FaSave /> {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <div className="info-item-fusion">
                  <span className="info-label">Nombre</span>
                  <span className="info-value">{user?.name}</span>
                </div>
                <div className="info-item-fusion">
                  <span className="info-label">E-mail</span>
                  <span className="info-value">{user?.email}</span>
                </div>
                <div className="info-item-fusion">
                  <span className="info-label">Teléfono</span>
                  <span className="info-value">{user?.phone || 'No registrado'}</span>
                </div>
                <div className="info-item-fusion full-width">
                  <span className="info-label">Dirección</span>
                  <span className="info-value">{user?.address || 'Sin dirección asignada'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-section-card alert-card">
            <div className="alert-content">
              <div className="alert-icon-box">🛡️</div>
              <div className="alert-text">
                <h3>Mantén tu cuenta segura</h3>
                <p>Verifica que tus datos sean correctos para una mejor experiencia de envío y seguridad.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;

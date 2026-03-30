import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Protege rutas que requieren autenticación
 * @param {React.ReactNode} children - Componente hijo a renderizar
 * @param {string} allowedRoles - Roles permitidos (opcional, separados por coma)
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica el token
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Redireccionar a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si se especificaron
  if (allowedRoles) {
    const roles = allowedRoles.split(',').map(r => r.trim());
    if (!roles.includes(user?.role)) {
      // Redireccionar según el rol del usuario
      if (user?.role === 'admin') {
        return <Navigate to="/admin" replace />;
      }
      if (user?.role === 'seller') {
        return <Navigate to="/seller" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

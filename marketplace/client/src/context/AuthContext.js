import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurar axios con el token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // Verificar si el usuario está autenticado al cargar
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/verify');
          if (response.data.success && response.data.data) {
            setUser(response.data.data);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error verificando token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success && response.data.data) {
        const { token: newToken, user: userData } = response.data.data;
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        
        toast.success('¡Bienvenido de vuelta!');
        return { success: true };
      }
      
      toast.error('Error al iniciar sesión');
      return { success: false, message: 'Error al iniciar sesión' };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success && response.data.data) {
        const { token: newToken, user: newUser } = response.data.data;
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        
        toast.success('¡Cuenta creada exitosamente!');
        return { success: true };
      }
      
      toast.error('Error al registrarse');
      return { success: false, message: 'Error al registrarse' };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrarse';
      toast.error(message);
      return { success: false, message };
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/users/profile', profileData);
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
        toast.success('Perfil actualizado');
        return { success: true };
      }
      toast.error('Error al actualizar perfil');
      return { success: false };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout: handleLogout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller' || user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

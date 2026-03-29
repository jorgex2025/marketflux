const jwt = require('jsonwebtoken');
const { getById } = require('../database/db');

// Middleware para verificar token JWT
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener usuario de la base de datos (async)
    const user = await getById('users', decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Usuario no encontrado.'
      });
    }
    
    // Agregar usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error en la autenticación.'
    });
  }
};

// Middleware para verificar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No autenticado.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. No tienes permisos suficientes.'
      });
    }
    
    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await getById('users', decoded.id);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    }
    
    next();
  } catch (error) {
    // Si hay error, simplemente continúa sin usuario
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};

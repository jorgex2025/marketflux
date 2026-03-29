const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAll, getById, add, update, find } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role = 'buyer' } = req.body;
    
    // Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son requeridos'
      });
    }
    
    // Verificar si el email ya existe
    const existingUsers = await find('users', { email });
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const newUser = await add('users', {
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      address: address || '',
      role: role === 'seller' ? 'seller' : 'buyer',
      avatar: null,
      storeName: role === 'seller' ? name : null,
      storeDescription: role === 'seller' ? '' : null,
      storeRating: role === 'seller' ? 0 : null,
      totalSales: role === 'seller' ? 0 : null
    });
    
    // Generar token
    const token = generateToken(newUser);
    
    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }
    
    // Buscar usuario por email
    const users = await find('users', { email });
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const user = users[0];
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generar token
    const token = generateToken(user);
    
    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
});

// GET /api/auth/me - Obtener usuario actual
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await getById('users', req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
});

// GET /api/auth/verify - Verificar token y obtener usuario actual (alias de /me para AuthContext)
router.get('/verify', authenticate, async (req, res) => {
  try {
    const user = await getById('users', req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario no existe'
      });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario'
    });
  }
});

// PUT /api/auth/profile - Actualizar perfil
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, address, avatar, storeName, storeDescription } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (avatar !== undefined) updates.avatar = avatar;
    
    // Campos específicos para vendedores
    if (req.user.role === 'seller') {
      if (storeName !== undefined) updates.storeName = storeName;
      if (storeDescription !== undefined) updates.storeDescription = storeDescription;
    }
    
    const updatedUser = await update('users', req.user.id, updates);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
});

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }
    
    const user = await getById('users', req.user.id);
    
    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await update('users', req.user.id, { password: hashedPassword });
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
});

module.exports = router;

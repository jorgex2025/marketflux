const express = require('express');
const router = express.Router();
const { getAll, getById, update } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/users/profile - Obtener perfil del usuario actual
router.get('/profile', authenticate, async (req, res) => {
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
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
});

// PUT /api/users/profile - Actualizar perfil del usuario
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (avatar !== undefined) updates.avatar = avatar;
    
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

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await getAll('users');
    
    // Remover contraseñas de la respuesta
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    
    res.json({
      success: true,
      data: usersWithoutPasswords
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
});

// GET /api/users/:id - Obtener un usuario por ID (solo admin)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await getById('users', req.params.id);
    
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

// PUT /api/users/:id/role - Actualizar rol de usuario (solo admin)
router.put('/:id/role', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    
    const validRoles = ['buyer', 'seller', 'admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Roles válidos: ${validRoles.join(', ')}`
      });
    }
    
    const user = await getById('users', req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const updates = { role };
    
    // Si se convierte en vendedor, agregar campos de tienda
    if (role === 'seller' && user.role !== 'seller') {
      updates.storeName = user.name;
      updates.storeDescription = '';
      updates.storeRating = 0;
      updates.totalSales = 0;
    }
    
    const updatedUser = await update('users', req.params.id, updates);
    
    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json({
      success: true,
      message: 'Rol de usuario actualizado',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol'
    });
  }
});

// PUT /api/users/:id/status - Activar/desactivar usuario (solo admin)
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Estado es requerido'
      });
    }
    
    const user = await getById('users', req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const updatedUser = await update('users', req.params.id, { isActive: status });
    
    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json({
      success: true,
      message: `Usuario ${status ? 'activado' : 'desactivado'} exitosamente`,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, remove, find } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// GET /api/addresses - Obtener todas las direcciones del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const addresses = await find('addresses', { userId: req.user.id });
    
    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener direcciones'
    });
  }
});

// POST /api/addresses - Crear nueva dirección
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, street, city, state, zipCode, country, phone, isDefault } = req.body;
    
    if (!name || !street || !city || !country) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, calle, ciudad y país son requeridos'
      });
    }
    
    // Si es la primera dirección o isDefault es true, establecer como predeterminada
    const existingAddresses = await find('addresses', { userId: req.user.id });
    const isFirstAddress = existingAddresses.length === 0;
    const shouldBeDefault = isFirstAddress || isDefault === true;
    
    // Si debe ser predeterminada, quitar isDefault de las demás
    if (shouldBeDefault) {
      for (const addr of existingAddresses) {
        if (addr.isDefault) {
          await update('addresses', addr.id, { isDefault: false });
        }
      }
    }
    
    const newAddress = await add('addresses', {
      userId: req.user.id,
      name,
      street,
      city,
      state: state || '',
      zipCode: zipCode || '',
      country,
      phone: phone || '',
      isDefault: shouldBeDefault ? 1 : 0
    });
    
    res.status(201).json({
      success: true,
      message: 'Dirección creada exitosamente',
      data: newAddress
    });
  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear dirección'
    });
  }
});

// PUT /api/addresses/:id - Actualizar dirección
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, street, city, state, zipCode, country, phone, isDefault } = req.body;
    
    const address = await getById('addresses', id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }
    
    if (address.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta dirección'
      });
    }
    
    // Si se establece como predeterminada, quitar isDefault de las demás
    if (isDefault && !address.isDefault) {
      const userAddresses = await find('addresses', { userId: req.user.id });
      for (const addr of userAddresses) {
        if (addr.isDefault && addr.id !== id) {
          await update('addresses', addr.id, { isDefault: false });
        }
      }
    }
    
    const updatedAddress = await update('addresses', id, {
      ...(name && { name }),
      ...(street && { street }),
      ...(city && { city }),
      ...(state !== undefined && { state }),
      ...(zipCode !== undefined && { zipCode }),
      ...(country && { country }),
      ...(phone !== undefined && { phone }),
      ...(isDefault !== undefined && { isDefault: isDefault ? 1 : 0 }),
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Dirección actualizada exitosamente',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar dirección'
    });
  }
});

// DELETE /api/addresses/:id - Eliminar dirección
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await getById('addresses', id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }
    
    if (address.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta dirección'
      });
    }
    
    const allAddresses = await find('addresses', { userId: req.user.id });
    const wasDefault = address.isDefault;
    
    await remove('addresses', id);
    
    if (wasDefault && allAddresses.length > 1) {
      const remainingAddresses = allAddresses.filter(a => a.id !== id);
      await update('addresses', remainingAddresses[0].id, { isDefault: true });
    }
    
    res.json({
      success: true,
      message: 'Dirección eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar dirección'
    });
  }
});

// PUT /api/addresses/:id/default - Establecer como dirección predeterminada
router.put('/:id/default', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const address = await getById('addresses', id);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }
    
    if (address.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta dirección'
      });
    }
    
    // Quitar isDefault de todas las direcciones del usuario
    const userAddresses = await find('addresses', { userId: req.user.id });
    for (const addr of userAddresses) {
      if (addr.isDefault) {
        await update('addresses', addr.id, { isDefault: false });
      }
    }
    
    // Establecer la dirección seleccionada como predeterminada
    const updatedAddress = await update('addresses', id, { 
      isDefault: 1,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Dirección establecida como predeterminada',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error al establecer dirección predeterminada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al establecer dirección predeterminada'
    });
  }
});

module.exports = router;
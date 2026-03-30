const express = require('express');
const router = express.Router();
const { getAll, getById, update, add } = require('../database/db');
const { authenticate, authorize } = require('../middleware/auth');

const DEFAULT_SETTINGS = [
  { key: 'siteName', value: 'MarketPlace', description: 'Nombre del sitio' },
  { key: 'siteDescription', value: 'Tu marketplace preferido', description: 'Descripción del sitio' },
  { key: 'contactEmail', value: 'contacto@marketplace.com', description: 'Email de contacto' },
  { key: 'phone', value: '+1234567890', description: 'Teléfono de contacto' },
  { key: 'shippingCost', value: '10', description: 'Costo de envío estándar' },
  { key: 'freeShippingThreshold', value: '100', description: 'Monto mínimo para envío gratis' },
  { key: 'taxRate', value: '16', description: 'Tasa de impuesto (%)' },
  { key: 'minOrderAmount', value: '50', description: 'Monto mínimo de orden' },
  { key: 'maintenanceMode', value: 'false', description: 'Modo mantenimiento' },
  { key: 'allowReviews', value: 'true', description: 'Permitir reseñas' }
];

const ensureSettingsExist = async () => {
  let settings = await getAll('settings');
  if (!settings || settings.length === 0) {
    for (const setting of DEFAULT_SETTINGS) {
      await add('settings', setting);
    }
    settings = await getAll('settings');
  }
  return settings;
};

router.get('/', async (req, res) => {
  try {
    let settings = await ensureSettingsExist();
    
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
});

router.put('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      siteName,
      siteDescription,
      contactEmail,
      phone,
      shippingCost,
      freeShippingThreshold,
      taxRate,
      minOrderAmount,
      maintenanceMode,
      allowReviews
    } = req.body;

    const validKeys = DEFAULT_SETTINGS.map(s => s.key);
    const updates = {};

    for (const [key, value] of Object.entries(req.body)) {
      if (validKeys.includes(key)) {
        updates[key] = String(value);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron configuraciones válidas para actualizar'
      });
    }

    const currentSettings = await ensureSettingsExist();

    for (const setting of currentSettings) {
      if (updates[setting.key] !== undefined) {
        await update('settings', setting.id, { value: updates[setting.key] });
      }
    }

    const updatedSettings = await getAll('settings');
    const settingsMap = updatedSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: settingsMap
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración'
    });
  }
});

module.exports = router;

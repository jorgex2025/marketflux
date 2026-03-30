const express = require('express');
const router = express.Router();
const { getAll, getById, add, update, remove, find } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const createNotification = async (userId, type, title, message, data = {}) => {
  return await add('notifications', {
    userId: parseInt(userId),
    type,
    title,
    message,
    data: JSON.stringify(data),
    isRead: false
  });
};

router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await find('notifications', { userId: req.user.id });
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones'
    });
  }
});

router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const notifications = await find('notifications', { userId: req.user.id });
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error al contar notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contar notificaciones no leídas'
    });
  }
});

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await getById('notifications', req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar esta notificación'
      });
    }

    const updated = await update('notifications', req.params.id, { isRead: true });

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: updated
    });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída'
    });
  }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    const notifications = await find('notifications', { userId: req.user.id });
    const unreadNotifications = notifications.filter(n => !n.isRead);

    for (const notification of unreadNotifications) {
      await update('notifications', notification.id, { isRead: true });
    }

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas las notificaciones como leídas'
    });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await getById('notifications', req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    if (notification.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta notificación'
      });
    }

    await remove('notifications', req.params.id);

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación'
    });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
